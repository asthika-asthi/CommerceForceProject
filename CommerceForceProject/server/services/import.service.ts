import fs from 'fs';
import Papa from 'papaparse';
import { ProductService } from './product.service';
import { AdminService } from './admin.service';
import { ConfigService } from './config.service';
import { WarehouseService } from './warehouse.service';
import { CategoryService } from './category.service';
import { Product } from '../../src/shared/types';

export class ImportService {
  /**
   * Processes a Product CSV file
   * Expected headers: name, sku, description, category, sub_category, base_price, sale_percentage, stock, image_url, images, is_active, allow_direct_buy
   */
  static async processProductCsv(filePath: string, userId: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const results = { success: 0, failed: 0, errors: [] as string[] };

    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')
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

    // Shared category cache to avoid constant database lookups
    const categoryCache = new Map<string, any>();
    const allCategories = await CategoryService.getAll();
    allCategories.forEach(cat => categoryCache.set(cat.name.toLowerCase(), cat));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // 1. Mandatory fields validation
        if (!row.name) throw new Error('Product name is required');
        if (row.base_price === undefined || row.base_price === '') throw new Error('Base price is required');

        // 2. Category Handling
        let categoryName = row.category || 'General';
        let subCategoryName = row.sub_category;
        
        let finalCategory = categoryName;

        // Ensure parent category exists
        let parentCat = categoryCache.get(categoryName.toLowerCase());
        if (!parentCat) {
          parentCat = await CategoryService.create({ name: categoryName });
          categoryCache.set(categoryName.toLowerCase(), parentCat);
        }

        // Handle sub-category if provided
        if (subCategoryName && subCategoryName.trim().length > 0) {
          const subCatKey = `${categoryName.toLowerCase()}:${subCategoryName.toLowerCase()}`;
          let subCat = categoryCache.get(subCatKey);
          
          if (!subCat) {
            // Check if it already exists in DB but not in cache with this parent
            const allCats = await CategoryService.getAll();
            subCat = allCats.find(c => c.name.toLowerCase() === subCategoryName.toLowerCase() && c.parent_id === parentCat.id);
            
            if (!subCat) {
              subCat = await CategoryService.create({ 
                name: subCategoryName, 
                parent_id: parentCat.id 
              });
            }
            categoryCache.set(subCatKey, subCat);
          }
          finalCategory = subCategoryName;
        }

        const productData: Partial<Product> = {
          sku: row.sku || undefined,
          name: row.name,
          description: row.description || '',
          category: finalCategory,
          base_price: parseFloat(row.base_price) || 0,
          sale_percentage: parseFloat(row.sale_percentage) || 0,
          image_url: row.image_url || '',
          is_active: isTrue(row.is_active),
          is_featured: isTrue(row.is_featured),
          allow_direct_buy: isTrue(row.allow_direct_buy)
        };

        // Handle multiple images (comma separated)
        if (row.images) {
          productData.images = row.images.split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0);
        }

        // Create/Update product
        let product: Product;
        const existingBySku = productData.sku ? await ProductService.getBySku(productData.sku) : null;
        
        if (existingBySku) {
          product = await ProductService.update(existingBySku.id, productData);
        } else {
          product = await ProductService.create(productData);
        }

        // 3. Handle stock
        const stockValue = parseInt(row.stock || row.initial_stock);
        const minStock = parseInt(row.min_stock_level) || 0;
        
        if (!isNaN(stockValue)) {
          const warehouses = await WarehouseService.getAll();
          if (warehouses.length > 0) {
            // Use the first warehouse as default
            const targetWarehouse = warehouses[0];
            await WarehouseService.updateStock(
              targetWarehouse.id, 
              product.id, 
              stockValue, 
              minStock
            );
          }
        }

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${err.message}`);
        console.error(`Import error at row ${i + 2}:`, err);
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
