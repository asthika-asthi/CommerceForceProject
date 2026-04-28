import db from '../db';
import { Category } from '../../src/shared/types';

export class CategoryService {
  static async getAll(): Promise<Category[]> {
    const query = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.name = p.category
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `;
    const result = await db.query(query);
    return result.rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      product_count: Number(row.product_count || 0)
    }));
  }

  static async create(data: Partial<Category>): Promise<Category> {
    let { name, parent_id, description, image_url, sort_order = 0, show_in_menu = 1 } = data;
    if (!name) throw new Error('Category name is required');
    
    // Convert empty string parent_id to null
    if ((parent_id as any) === '') parent_id = undefined;
    
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // If it has a parent, try to make slug unique by prefixing parent slug
    if (parent_id) {
      const parentResult = await db.query('SELECT slug FROM categories WHERE id = ?', [parent_id]);
      if (parentResult.rows.length > 0) {
        slug = `${parentResult.rows[0].slug}-${slug}`;
      }
    }

    // Ensure slug is unique even if prefixing didn't help (e.g. same name, same parent - shouldn't happen but for safety)
    const existingSlug = await db.query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existingSlug.rows.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(7)}`;
    }
    
    await db.query(`
      INSERT INTO categories (name, slug, parent_id, description, image_url, sort_order, show_in_menu)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, slug, parent_id || null, description, image_url, sort_order, show_in_menu]);
    
    const result = await db.query('SELECT * FROM categories WHERE slug = ?', [slug]);
    return result.rows[0];
  }

  static async update(id: number, data: Partial<Category>): Promise<void> {
    const fields = Object.keys(data).filter(k => ['name', 'parent_id', 'description', 'image_url', 'sort_order', 'is_active', 'show_in_menu'].includes(k));
    if (fields.length === 0) return;

    const values = fields.map(f => {
      let val = (data as any)[f];
      if (f === 'parent_id' && val === '') return null;
      return val;
    });

    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await db.query(`UPDATE categories SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
  }

  static async delete(id: number): Promise<void> {
    // Check if any products are using this category name
    const categoryResult = await db.query('SELECT name FROM categories WHERE id = ?', [id]);
    if (categoryResult.rows.length === 0) return;
    
    const catName = categoryResult.rows[0].name;
    const productsResult = await db.query('SELECT COUNT(*) as count FROM products WHERE category = ?', [catName]);
    
    if (productsResult.rows[0].count > 0) {
      throw new Error('Cannot delete category because it has products associated with it.');
    }
    
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
  }
}
