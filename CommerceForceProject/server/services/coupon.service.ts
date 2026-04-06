import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { Coupon } from '../../src/shared/types';

export class CouponService {
  static async getAll(): Promise<Coupon[]> {
    const result = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
    return result.rows.map(row => ({ ...row, is_active: !!row.is_active }));
  }

  static async getByCode(code: string): Promise<Coupon | null> {
    const result = await db.query('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [code]);
    const row = result.rows[0];
    if (!row) return null;
    return { ...row, is_active: !!row.is_active };
  }

  static async create(data: Omit<Coupon, 'id' | 'used_count' | 'is_active' | 'created_at'>): Promise<Coupon> {
    const id = uuidv4();
    await db.query(`
      INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount_amount, expiry_date, usage_limit, used_count, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
    `, [
      id, 
      data.code.toUpperCase(), 
      data.type, 
      data.value, 
      data.min_order_amount || 0, 
      data.max_discount_amount || null, 
      data.expiry_date || null, 
      data.usage_limit || null
    ]);
    const coupon = await this.getById(id);
    return coupon!;
  }

  static async getById(id: string): Promise<Coupon | null> {
    const result = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
    const row = result.rows[0];
    if (!row) return null;
    return { ...row, is_active: !!row.is_active };
  }

  static async delete(id: string): Promise<void> {
    await db.query('DELETE FROM coupons WHERE id = ?', [id]);
  }

  static async validateCoupon(code: string, orderAmount: number): Promise<{ isValid: boolean; discount: number; error?: string }> {
    const coupon = await this.getByCode(code);
    if (!coupon) return { isValid: false, discount: 0, error: 'Invalid coupon code' };

    if (!coupon.is_active) return { isValid: false, discount: 0, error: 'Coupon is inactive' };

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return { isValid: false, discount: 0, error: 'Coupon has expired' };
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { isValid: false, discount: 0, error: 'Coupon usage limit reached' };
    }

    if (orderAmount < coupon.min_order_amount) {
      return { isValid: false, discount: 0, error: `Minimum order amount of $${coupon.min_order_amount} required` };
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = orderAmount * (coupon.value / 100);
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else {
      discount = coupon.value;
    }

    // Ensure discount doesn't exceed order amount
    discount = Math.min(discount, orderAmount);

    return { isValid: true, discount };
  }

  static async incrementUsage(id: string): Promise<void> {
    await db.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [id]);
  }
}
