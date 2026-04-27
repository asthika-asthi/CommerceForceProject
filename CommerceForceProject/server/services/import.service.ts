import fs from 'fs';
import Papa from 'papaparse';
import { ProductService } from './product.service';
import { AdminService } from './admin.service';
import { ConfigService } from './config.service';
import { WarehouseService } from './warehouse.service';
import { Product } from '../../src/shared/types';

export class ImportService {
  /**
   * Processes a Product CSV file
   * Expected headers: name, description, category, base_price, sale_percentage, image_url, allow_direct_buy
   */
  static async processProductCsv(filePath: string, userId: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const results = { success: 0, failed: 0, errors: [] as string[] };

    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/-/g, '_')
    });

    if (parsed.errors.length > 0) {
      return { 
        success: 0, 
        failed: 0, 
        errors: parsed.errors.map(e => `CSV Parsing Error: ${e.message} at row ${e.row}`) 
      };
    }

    const rows = parsed.data as any[];

    const isTrue = (val: any) => {
      if (val === undefined || val === null || val === '') return true;
      const v = String(val).toLowerCase().trim();
      return v === 'true' || v === '1' || v === 'yes';
    };

    const isFalse = (val: any) => {
      if (val === undefined || val === null || val === '') return false;
      const v = String(val).toLowerCase().trim();
      return v === 'false' || v === '0' || v === 'no';
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const productData: Partial<Product> = {
          sku: row.sku || undefined,
          name: row.name,
          description: row.description,
          category: row.category,
          base_price: parseFloat(row.base_price) || 0,
          sale_percentage: parseFloat(row.sale_percentage) || 0,
          image_url: row.image_url,
          is_active: isTrue(row.is_active),
          is_featured: row.is_featured ? isTrue(row.is_featured) : false,
          allow_direct_buy: isTrue(row.allow_direct_buy)
        };

        // Handle multiple images (comma separated)
        if (row.images) {
          productData.images = row.images.split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0);
        }

        // Create/Update product
        let product: Product;
        if (row.id) {
          product = await ProductService.update(row.id, productData);
        } else {
          // If we have an existing product with same SKU, update it instead of failing
          const existingBySku = row.sku ? await ProductService.getBySku(row.sku) : null;
          if (existingBySku) {
            product = await ProductService.update(existingBySku.id, productData);
          } else {
            product = await ProductService.create(productData);
          }
        }

        // Handle initial stock if provided
        const initialStock = parseInt(row.initial_stock);
        const minStock = parseInt(row.min_stock_level);
        
        if (!isNaN(initialStock) || !isNaN(minStock)) {
          const warehouses = await WarehouseService.getAll();
          if (warehouses.length > 0) {
            // Add to the first active warehouse
            const targetWarehouse = warehouses[0];
            await WarehouseService.updateStock(
              targetWarehouse.id, 
              product.id, 
              isNaN(initialStock) ? 0 : initialStock, 
              isNaN(minStock) ? 0 : minStock
            );
          }
        }

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${err.message}`); // +2 because of header and 0-index
      }
    }

    await AdminService.logActivity(userId, 'Bulk Product Import', `Processed ${results.success} products successfully, ${results.failed} failed.`);
    return results;
  }

  /**
   * Processes a Master JSON Config file
   */
  static async processMasterConfig(filePath: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    let config: any;

    try {
      config = JSON.parse(content);
    } catch (err: any) {
      // Extract line number if possible from SyntaxError
      const match = err.message.match(/at line (\d+)/);
      const lineInfo = match ? ` at line ${match[1]}` : '';
      const errorMsg = `JSON Parsing Error${lineInfo}: ${err.message}`;
      
      await AdminService.logActivity(userId, 'Config Import Failed', errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      // 1. Update Branding if present
      if (config.branding) {
        await AdminService.updateBranding(config.branding);
        await ConfigService.saveBrandingConfig(config.branding);
      }

      // 2. Update Features if present
      if (config.features && Array.isArray(config.features)) {
        for (const feature of config.features) {
          await AdminService.toggleFeatureFlag(feature.feature_key, feature.enabled);
        }
      }

      // 3. Update Landing if present
      if (config.landing) {
        await ConfigService.saveLandingConfig(config.landing);
      }

      await AdminService.logActivity(userId, 'Master Config Imported', 'System configuration updated via master JSON upload.');
      return { success: true };
    } catch (err: any) {
      const errorMsg = `Configuration Error: ${err.message}`;
      await AdminService.logActivity(userId, 'Config Import Failed', errorMsg);
      return { success: false, error: errorMsg };
    }
  }
}
