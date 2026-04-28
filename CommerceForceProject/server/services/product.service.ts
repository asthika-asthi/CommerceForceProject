import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { Product } from '../../src/shared/types';

export class ProductService {
  static async getAll(includeInactive = false): Promise<Product[]> {
    const query = includeInactive 
      ? `
        SELECT p.*, COALESCE(SUM(i.quantity), 0) as total_stock 
        FROM products p 
        LEFT JOIN inventory i ON p.id = i.product_id 
        GROUP BY p.id 
        ORDER BY p.created_at DESC
      ` 
      : `
        SELECT p.*, COALESCE(SUM(i.quantity), 0) as total_stock 
        FROM products p 
        LEFT JOIN inventory i ON p.id = i.product_id 
        WHERE p.is_active = 1 
        GROUP BY p.id 
        ORDER BY p.created_at DESC
      `;
    
    const result = await db.query(query);
    return result.rows.map(this.mapToProduct);
  }

  static async getById(id: string): Promise<Product | null> {
    const result = await db.query(`
      SELECT p.*, COALESCE(SUM(i.quantity), 0) as total_stock 
      FROM products p 
      LEFT JOIN inventory i ON p.id = i.product_id 
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);
    const product = result.rows[0];
    return product ? this.mapToProduct(product) : null;
  }

  static async getBySku(sku: string): Promise<Product | null> {
    const result = await db.query(`
      SELECT p.*, COALESCE(SUM(i.quantity), 0) as total_stock 
      FROM products p 
      LEFT JOIN inventory i ON p.id = i.product_id 
      WHERE p.sku = ?
      GROUP BY p.id
    `, [sku]);
    const product = result.rows[0];
    return product ? this.mapToProduct(product) : null;
  }

  static async create(data: Partial<Product>): Promise<Product> {
    const id = uuidv4();
    let { sku, name, description, category, category_id, base_price, sale_percentage = 0, image_url, images = [], is_active = 1, allow_direct_buy = 1 } = data;

    if (!name || base_price === undefined) {
      throw new Error('Missing required product fields: name, base_price');
    }

    if (!sku) {
      const prefix = (category || 'PROD').substring(0, 3).toUpperCase();
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      sku = `${prefix}-${random}`;
    }

    await db.query(`
      INSERT INTO products (id, sku, name, description, category, category_id, base_price, sale_percentage, image_url, images, is_active, allow_direct_buy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, sku, name, description, category, category_id || null, base_price, sale_percentage, image_url, JSON.stringify(images), is_active ? 1 : 0, allow_direct_buy ? 1 : 0]);

    const product = await this.getById(id);
    return product!;
  }

  static async update(id: string, data: Partial<Product>): Promise<Product> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    const fields = Object.keys(data).filter(key => 
      ['sku', 'name', 'description', 'category', 'category_id', 'base_price', 'sale_percentage', 'image_url', 'images', 'is_active', 'allow_direct_buy'].includes(key)
    );

    if (fields.length === 0) return existing;

    const setClause = fields.map((field, index) => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const val = (data as any)[field];
      if (field === 'is_active' || field === 'allow_direct_buy') return val ? 1 : 0;
      if (field === 'images') return JSON.stringify(val);
      return val;
    });

    await db.query(`UPDATE products SET ${setClause} WHERE id = ?`, [...values, id]);

    const product = await this.getById(id);
    return product!;
  }

  static async delete(id: string): Promise<void> {
    const client = await db.getClient();
    try {
      if (!db.isSqlite()) {
        await client.query('BEGIN');
      } else {
        await client.query('BEGIN TRANSACTION');
      }

      // 1. Check for orders
      const orderItems = await db.queryWithClient(client, 'SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1', [id]);
      if (orderItems.rows.length > 0) {
        throw new Error('Cannot delete product with existing orders. This product has historical order data.');
      }

      // 2. Clear inventory alerts
      await db.queryWithClient(client, 'DELETE FROM inventory_alerts WHERE product_id = ?', [id]);

      // 3. Clear inventory
      await db.queryWithClient(client, 'DELETE FROM inventory WHERE product_id = ?', [id]);

      // 4. Clear RFQ items
      await db.queryWithClient(client, 'DELETE FROM rfq_items WHERE product_id = ?', [id]);

      // 5. Delete product
      const result = await db.queryWithClient(client, 'DELETE FROM products WHERE id = ?', [id]);
      
      if (result.rowCount === 0) {
        throw new Error('Product not found');
      }

      if (!db.isSqlite()) {
        await client.query('COMMIT');
      } else {
        await client.query('COMMIT');
      }
    } catch (error) {
      if (!db.isSqlite()) {
        await client.query('ROLLBACK');
      } else {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  private static mapToProduct(row: any): Product {
    let images = [];
    try {
      images = typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []);
    } catch (e) {
      images = [];
    }
    return {
      ...row,
      images,
      is_active: Boolean(row.is_active),
      is_featured: Boolean(row.is_featured),
      allow_direct_buy: Boolean(row.allow_direct_buy),
      sale_percentage: Number(row.sale_percentage || 0),
      total_stock: Number(row.total_stock || 0)
    };
  }
}
