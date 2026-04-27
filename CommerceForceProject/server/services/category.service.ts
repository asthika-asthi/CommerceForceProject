import db from '../db';

export interface Category {
  id: number;
  parent_id?: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
}

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
    const { name, parent_id, description, image_url, sort_order = 0 } = data;
    if (!name) throw new Error('Category name is required');
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    await db.query(`
      INSERT INTO categories (name, slug, parent_id, description, image_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, slug, parent_id, description, image_url, sort_order]);
    
    const result = await db.query('SELECT * FROM categories WHERE slug = ?', [slug]);
    return result.rows[0];
  }

  static async update(id: number, data: Partial<Category>): Promise<void> {
    const fields = Object.keys(data).filter(k => ['name', 'parent_id', 'description', 'image_url', 'sort_order', 'is_active'].includes(k));
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (data as any)[f]);

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
