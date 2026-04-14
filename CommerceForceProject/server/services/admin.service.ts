import db from "../db";
import bcrypt from "bcryptjs";
import { BrandingConfig, FeatureFlag, Product, DashboardStats } from "../../src/shared/types";

export class AdminService {
  static async getBranding(): Promise<BrandingConfig> {
    const result = await db.query("SELECT * FROM branding_config LIMIT 1");
    const branding = result.rows[0];
    if (!branding) return {} as BrandingConfig;
    
    return {
      ...branding,
      footer_use_brand_color: Boolean(branding.footer_use_brand_color),
      social_links_enabled: branding.social_links_enabled !== 0,
      contact_page_enabled: Boolean(branding.contact_page_enabled),
      carousel_enabled: Boolean(branding.carousel_enabled),
      hero_enabled: branding.hero_enabled !== 0
    } as BrandingConfig;
  }

  static async ensureSchema(): Promise<void> {
    try {
      // Add currency columns if they don't exist
      await db.query(`
        ALTER TABLE branding_config 
        ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '£',
        ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'GBP',
        ADD COLUMN IF NOT EXISTS button_style VARCHAR(20) DEFAULT 'rounded',
        ADD COLUMN IF NOT EXISTS background_style VARCHAR(20) DEFAULT 'solid',
        ADD COLUMN IF NOT EXISTS background_value TEXT,
        ADD COLUMN IF NOT EXISTS hero_title TEXT,
        ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
        ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
        ADD COLUMN IF NOT EXISTS hero_cta_text TEXT,
        ADD COLUMN IF NOT EXISTS hero_cta_link TEXT,
        ADD COLUMN IF NOT EXISTS featured_products TEXT,
        ADD COLUMN IF NOT EXISTS layout_config TEXT,
        ADD COLUMN IF NOT EXISTS footer_config TEXT,
        ADD COLUMN IF NOT EXISTS footer_email TEXT,
        ADD COLUMN IF NOT EXISTS footer_address TEXT,
        ADD COLUMN IF NOT EXISTS footer_phone TEXT,
        ADD COLUMN IF NOT EXISTS footer_copyright TEXT,
        ADD COLUMN IF NOT EXISTS footer_use_brand_color BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS social_links_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS contact_page_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS payment_methods_config TEXT,
        ADD COLUMN IF NOT EXISTS base_font_size INTEGER DEFAULT 16,
        ADD COLUMN IF NOT EXISTS hero_font_size INTEGER DEFAULT 48,
        ADD COLUMN IF NOT EXISTS heading_font_size INTEGER DEFAULT 32,
        ADD COLUMN IF NOT EXISTS content_font_size INTEGER DEFAULT 16,
        ADD COLUMN IF NOT EXISTS carousel_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS carousel_images TEXT DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS hero_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS admin_email TEXT
      `);
    } catch (err) {
      console.error('Failed to ensure schema:', err);
    }
  }

  static async updateBranding(config: Partial<BrandingConfig>): Promise<void> {
    const current = await this.getBranding();
    if (current) {
      await db.query(`
        UPDATE branding_config 
        SET company_name = ?, primary_color = ?, secondary_color = ?, font_family = ?, 
            logo_url = ?, favicon_url = ?, button_style = ?, background_style = ?, 
            background_value = ?, hero_title = ?, hero_subtitle = ?, hero_image_url = ?, 
            hero_cta_text = ?, hero_cta_link = ?, featured_products = ?, 
            layout_config = ?, footer_config = ?, footer_email = ?, footer_address = ?,
            footer_phone = ?, footer_copyright = ?, footer_use_brand_color = ?, 
            social_links_enabled = ?, contact_page_enabled = ?, payment_methods_config = ?,
            currency_symbol = ?, currency_code = ?,
            base_font_size = ?, hero_font_size = ?, heading_font_size = ?, content_font_size = ?,
            carousel_enabled = ?, carousel_images = ?, hero_enabled = ?, admin_email = ?
        WHERE id = ?
      `, [
        config.company_name || current.company_name,
        config.primary_color || current.primary_color,
        config.secondary_color || current.secondary_color,
        config.font_family || current.font_family,
        config.logo_url !== undefined ? config.logo_url : current.logo_url,
        config.favicon_url !== undefined ? config.favicon_url : current.favicon_url,
        config.button_style || current.button_style,
        config.background_style || current.background_style,
        config.background_value !== undefined ? config.background_value : current.background_value,
        config.hero_title !== undefined ? config.hero_title : current.hero_title,
        config.hero_subtitle !== undefined ? config.hero_subtitle : current.hero_subtitle,
        config.hero_image_url !== undefined ? config.hero_image_url : current.hero_image_url,
        config.hero_cta_text !== undefined ? config.hero_cta_text : current.hero_cta_text,
        config.hero_cta_link !== undefined ? config.hero_cta_link : current.hero_cta_link,
        config.featured_products !== undefined ? config.featured_products : current.featured_products,
        config.layout_config !== undefined ? config.layout_config : current.layout_config,
        config.footer_config !== undefined ? config.footer_config : current.footer_config,
        config.footer_email !== undefined ? config.footer_email : current.footer_email,
        config.footer_address !== undefined ? config.footer_address : current.footer_address,
        config.footer_phone !== undefined ? config.footer_phone : current.footer_phone,
        config.footer_copyright !== undefined ? config.footer_copyright : current.footer_copyright,
        config.footer_use_brand_color !== undefined ? (config.footer_use_brand_color ? 1 : 0) : (current.footer_use_brand_color ? 1 : 0),
        config.social_links_enabled !== undefined ? (config.social_links_enabled ? 1 : 0) : (current.social_links_enabled ? 1 : 0),
        config.contact_page_enabled !== undefined ? (config.contact_page_enabled ? 1 : 0) : (current.contact_page_enabled ? 1 : 0),
        config.payment_methods_config !== undefined ? config.payment_methods_config : current.payment_methods_config,
        config.currency_symbol || current.currency_symbol || '£',
        config.currency_code || current.currency_code || 'GBP',
        config.base_font_size || current.base_font_size || 16,
        config.hero_font_size || current.hero_font_size || 48,
        config.heading_font_size || current.heading_font_size || 32,
        config.content_font_size || current.content_font_size || 16,
        config.carousel_enabled !== undefined ? (config.carousel_enabled ? 1 : 0) : (current.carousel_enabled ? 1 : 0),
        Array.isArray(config.carousel_images) ? JSON.stringify(config.carousel_images) : (config.carousel_images !== undefined ? config.carousel_images : current.carousel_images),
        config.hero_enabled !== undefined ? (config.hero_enabled ? 1 : 0) : (current.hero_enabled !== false ? 1 : 0),
        config.admin_email !== undefined ? config.admin_email : current.admin_email,
        current.id
      ]);
    }
  }

  static async getFeatureFlags(): Promise<FeatureFlag[]> {
    const result = await db.query("SELECT * FROM feature_flags");
    return result.rows.map(row => ({
      ...row,
      enabled: Boolean(row.enabled)
    })) as FeatureFlag[];
  }

  static async toggleFeatureFlag(key: string, enabled: boolean): Promise<void> {
    await db.query("UPDATE feature_flags SET enabled = ? WHERE feature_key = ?", [enabled ? 1 : 0, key]);
  }

  static async getProducts(): Promise<Product[]> {
    const result = await db.query("SELECT * FROM products");
    return result.rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      allow_direct_buy: Boolean(row.allow_direct_buy),
      sale_percentage: Number(row.sale_percentage || 0)
    })) as Product[];
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    const totalProducts = (await db.query("SELECT COUNT(*) as count FROM products")).rows[0].count;
    const activeUsers = (await db.query("SELECT COUNT(*) as count FROM users")).rows[0].count;
    const activeWarehouses = (await db.query("SELECT COUNT(*) as count FROM warehouses WHERE is_active = 1")).rows[0].count;
    const enabledFeatures = (await db.query("SELECT COUNT(*) as count FROM feature_flags WHERE enabled = 1")).rows[0].count;

    return {
      totalProducts: Number(totalProducts),
      activeUsers: Number(activeUsers),
      activeWarehouses: Number(activeWarehouses),
      enabledFeatures: Number(enabledFeatures)
    };
  }

  static async getUsers(): Promise<any[]> {
    const result = await db.query(`
      SELECT u.id, u.email, u.name, r.name as role, u.credit_limit, u.available_credit
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `);
    return result.rows.map(row => ({
      ...row,
      credit_limit: row.credit_limit ? Number(row.credit_limit) : 0,
      available_credit: row.available_credit ? Number(row.available_credit) : 0
    }));
  }

  static async getUserByEmail(email: string): Promise<any> {
    const result = await db.query(`
      SELECT u.id, u.email, u.name, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `, [email]);
    return result.rows[0];
  }

  static async updateUserCreditLimit(userId: string, creditLimit: number): Promise<void> {
    const result = await db.query('SELECT credit_limit, available_credit FROM users WHERE id = ?', [userId]);
    const user = result.rows[0];
    if (!user) throw new Error('User not found');

    const diff = creditLimit - Number(user.credit_limit);
    await db.query('UPDATE users SET credit_limit = ?, available_credit = available_credit + ? WHERE id = ?', [creditLimit, diff, userId]);
  }

  static async updateUserRole(userId: string, roleName: string): Promise<void> {
    const roleResult = await db.query('SELECT id FROM roles WHERE name = ?', [roleName]);
    const role = roleResult.rows[0];
    if (!role) throw new Error('Role not found');

    await db.query('UPDATE users SET role_id = ? WHERE id = ?', [role.id, userId]);
  }

  static async seedData(): Promise<void> {
    // 1. Create users
    const roles = await db.query("SELECT id, name FROM roles");
    const roleMap = roles.rows.reduce((acc, r) => ({ ...acc, [r.name]: r.id }), {} as any);

    const usersToSeed = [
      { id: 'u-admin-001', email: 'admin-user@commerceforce.com', name: 'Admin User', role: 'admin', credit: 1000 },
      { id: 'u-client-001', email: 'client-user@commerceforce.com', name: 'Client User', role: 'client', credit: 5000 },
      { id: 'u-customer-001', email: 'customer-user@commerceforce.com', name: 'Customer User', role: 'customer', credit: 0 }
    ];

    const passwordHash = await bcrypt.hash('password123', 10);

    for (const u of usersToSeed) {
      await db.query(`
        INSERT INTO users (id, email, name, password_hash, role_id, credit_limit, available_credit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (email) DO UPDATE SET 
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          role_id = EXCLUDED.role_id,
          credit_limit = EXCLUDED.credit_limit,
          available_credit = EXCLUDED.available_credit
      `, [u.id, u.email, u.name, passwordHash, roleMap[u.role], u.credit, u.credit]);
    }

    // 2. Create Warehouse
    const whId = 'wh-main-001';
    await db.query(`
      INSERT INTO warehouses (id, name, code, location)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location
    `, [whId, 'Main Distribution Center', 'MAIN-DC-01', 'London, UK']);

    // 3. Add all products to this warehouse
    const products = await db.query("SELECT id FROM products");
    for (const p of products.rows) {
      await db.query(`
        INSERT INTO inventory (id, warehouse_id, product_id, quantity, min_stock_level)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET 
          quantity = EXCLUDED.quantity,
          min_stock_level = EXCLUDED.min_stock_level
      `, [`inv-${whId}-${p.id}`, whId, p.id, 100, 10]);
    }
  }
}
