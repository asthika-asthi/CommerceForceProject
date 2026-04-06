import db from "../db";
import { BrandingConfig, FeatureFlag, Product, DashboardStats } from "../../src/shared/types";

export class AdminService {
  static async getBranding(): Promise<BrandingConfig> {
    const result = await db.query("SELECT * FROM branding_config LIMIT 1");
    return result.rows[0] as BrandingConfig;
  }

  static async updateBranding(config: Partial<BrandingConfig>): Promise<void> {
    const current = await this.getBranding();
    if (current) {
      await db.query(`
        UPDATE branding_config 
        SET company_name = ?, primary_color = ?, logo_url = ?
        WHERE id = ?
      `, [
        config.company_name || current.company_name,
        config.primary_color || current.primary_color,
        config.logo_url || current.logo_url,
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
      allow_direct_buy: Boolean(row.allow_direct_buy)
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
    return result.rows;
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
}
