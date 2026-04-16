import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { LoyaltyPoints, LoyaltyTransaction } from '../../src/shared/types';
import { AdminService } from './admin.service';

export class LoyaltyService {
  static async getBalance(userId: string): Promise<number> {
    const result = await db.query('SELECT points FROM loyalty_points WHERE user_id = ?', [userId]);
    const row = result.rows[0];
    return row?.points || 0;
  }

  static async getHistory(userId: string): Promise<LoyaltyTransaction[]> {
    const result = await db.query('SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return result.rows;
  }

  static async addPoints(userId: string, points: number, type: LoyaltyTransaction['type'], description?: string, orderId?: string, client?: any): Promise<void> {
    if (points === 0) return;

    const useExternalClient = !!client;
    const dbClient = client || await db.getClient();
    
    try {
      if (!useExternalClient) {
        await dbClient.query('BEGIN');
      }
      
      // 1. Record transaction
      const id = uuidv4();
      await db.queryWithClient(dbClient, `
        INSERT INTO loyalty_transactions (id, user_id, order_id, points, type, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, userId, orderId || null, points, type, description || null]);

      // 2. Update balance
      const existingResult = await db.queryWithClient(dbClient, 'SELECT points FROM loyalty_points WHERE user_id = ?', [userId]);
      const existing = existingResult.rows[0];
      
      if (existing) {
        await db.queryWithClient(dbClient, 'UPDATE loyalty_points SET points = points + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [points, userId]);
      } else {
        await db.queryWithClient(dbClient, 'INSERT INTO loyalty_points (user_id, points) VALUES (?, ?)', [userId, points]);
      }

      if (!useExternalClient) {
        await dbClient.query('COMMIT');
      }
    } catch (error) {
      if (!useExternalClient) {
        await dbClient.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (!useExternalClient) {
        dbClient.release();
      }
    }
  }

  static async earnFromOrder(userId: string, orderId: string, totalAmount: number, client?: any): Promise<void> {
    // Rule: Dynamic points based on branding config
    const branding = await AdminService.getBranding();
    const multiplier = branding.loyalty_points_per_currency || 1;
    console.log(`EarnFromOrder: UserId=${userId}, OrderId=${orderId}, Total=${totalAmount}, Multiplier=${multiplier}`);
    const points = Math.floor(totalAmount * multiplier);
    const programName = branding.loyalty_program_name || 'Loyalty Points';
    
    if (points > 0) {
      console.log(`EarnFromOrder: Awarding ${points} points to ${userId}`);
      await this.addPoints(userId, points, 'earn', `${programName} earned from order #${orderId.substring(0, 8)}`, orderId, client);
    } else {
      console.log(`EarnFromOrder: 0 points calculated for Order #${orderId}`);
    }
  }

  static async getAllStats(): Promise<any[]> {
    const result = await db.query(`
      SELECT u.name, u.email, COALESCE(lp.points, 0) as points, lp.updated_at
      FROM users u
      LEFT JOIN loyalty_points lp ON u.id = lp.user_id
      JOIN roles r ON u.role_id = r.id
      WHERE r.name IN ('customer', 'client')
      ORDER BY points DESC
    `);
    return result.rows;
  }
}
