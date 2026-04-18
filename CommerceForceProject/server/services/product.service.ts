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
    let { sku, name, description, category, base_price, sale_percentage = 0, image_url, images = [], is_active = 1, allow_direct_buy = 1 } = data;

    if (!name || base_price === undefined) {
      throw new Error('Missing required product fields: name, base_price');
    }

    if (!sku) {
      const prefix = (category || 'PROD').substring(0, 3).toUpperCase();
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      sku = `${prefix}-${random}`;
    }

    await db.query(`
      INSERT INTO products (id, sku, name, description, category, base_price, sale_percentage, image_url, images, is_active, allow_direct_buy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, sku, name, description, category, base_price, sale_percentage, image_url, JSON.stringify(images), is_active ? 1 : 0, allow_direct_buy ? 1 : 0]);

    const product = await this.getById(id);
    return product!;
  }

  static async update(id: string, data: Partial<Product>): Promise<Product> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    const fields = Object.keys(data).filter(key => 
      ['sku', 'name', 'description', 'category', 'base_price', 'sale_percentage', 'image_url', 'images', 'is_active', 'allow_direct_buy'].includes(key)
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
    await db.query('DELETE FROM products WHERE id = ?', [id]);
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
      allow_direct_buy: Boolean(row.allow_direct_buy),
      sale_percentage: Number(row.sale_percentage || 0),
      total_stock: Number(row.total_stock || 0)
    };
  }
}
