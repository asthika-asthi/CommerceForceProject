import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { LoyaltyPoints, LoyaltyTransaction } from '../../src/shared/types';

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

  static async addPoints(userId: string, points: number, type: LoyaltyTransaction['type'], description?: string, orderId?: string): Promise<void> {
    if (points === 0) return;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // 1. Record transaction
      const id = uuidv4();
      await db.queryWithClient(client, `
        INSERT INTO loyalty_transactions (id, user_id, order_id, points, type, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, userId, orderId || null, points, type, description || null]);

      // 2. Update balance
      const existingResult = await db.queryWithClient(client, 'SELECT points FROM loyalty_points WHERE user_id = ?', [userId]);
      const existing = existingResult.rows[0];
      
      if (existing) {
        await db.queryWithClient(client, 'UPDATE loyalty_points SET points = points + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [points, userId]);
      } else {
        await db.queryWithClient(client, 'INSERT INTO loyalty_points (user_id, points) VALUES (?, ?)', [userId, points]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async earnFromOrder(userId: string, orderId: string, totalAmount: number): Promise<void> {
    // Rule: 1 point for every $1 spent
    const points = Math.floor(totalAmount);
    if (points > 0) {
      await this.addPoints(userId, points, 'earn', `Points earned from order #${orderId.substring(0, 8)}`, orderId);
    }
  }

  static async getAllStats(): Promise<any[]> {
    const result = await db.query(`
      SELECT u.name, u.email, lp.points, lp.updated_at
      FROM loyalty_points lp
      JOIN users u ON lp.user_id = u.id
      ORDER BY lp.points DESC
    `);
    return result.rows;
  }
}
