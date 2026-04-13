import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { Coupon } from '../../src/shared/types';
import { AdminService } from './admin.service';

export class CouponService {
  static async getAll(): Promise<Coupon[]> {
    const result = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
    return result.rows.map(row => ({ 
      ...row, 
      is_active: !!row.is_active,
      is_loyalty_only: !!row.is_loyalty_only
    }));
  }

  static async getByCode(code: string): Promise<Coupon | null> {
    const result = await db.query('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [code]);
    const row = result.rows[0];
    if (!row) return null;
    return { 
      ...row, 
      is_active: !!row.is_active,
      is_loyalty_only: !!row.is_loyalty_only
    };
  }

  static async create(data: Omit<Coupon, 'id' | 'used_count' | 'is_active' | 'created_at'>): Promise<Coupon> {
    const id = uuidv4();
    await db.query(`
      INSERT INTO coupons (id, code, type, value, min_order_amount, min_quantity, max_discount_amount, expiry_date, usage_limit, used_count, is_loyalty_only, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)
    `, [
      id, 
      data.code.toUpperCase(), 
      data.type, 
      data.value, 
      data.min_order_amount || 0, 
      data.min_quantity || 0,
      data.max_discount_amount || null, 
      data.expiry_date || null, 
      data.usage_limit || null,
      data.is_loyalty_only ? 1 : 0
    ]);
    const coupon = await this.getById(id);
    return coupon!;
  }

  static async update(id: string, data: Partial<Coupon>): Promise<Coupon> {
    const current = await this.getById(id);
    if (!current) throw new Error('Coupon not found');

    await db.query(`
      UPDATE coupons 
      SET code = ?, type = ?, value = ?, min_order_amount = ?, min_quantity = ?, 
          max_discount_amount = ?, expiry_date = ?, usage_limit = ?, 
          is_loyalty_only = ?, is_active = ?
      WHERE id = ?
    `, [
      (data.code || current.code).toUpperCase(),
      data.type || current.type,
      data.value !== undefined ? data.value : current.value,
      data.min_order_amount !== undefined ? data.min_order_amount : current.min_order_amount,
      data.min_quantity !== undefined ? data.min_quantity : current.min_quantity,
      data.max_discount_amount !== undefined ? data.max_discount_amount : current.max_discount_amount,
      data.expiry_date !== undefined ? data.expiry_date : current.expiry_date,
      data.usage_limit !== undefined ? data.usage_limit : current.usage_limit,
      data.is_loyalty_only !== undefined ? (data.is_loyalty_only ? 1 : 0) : (current.is_loyalty_only ? 1 : 0),
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : (current.is_active ? 1 : 0),
      id
    ]);

    const coupon = await this.getById(id);
    return coupon!;
  }

  static async getById(id: string): Promise<Coupon | null> {
    const result = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
    const row = result.rows[0];
    if (!row) return null;
    return { 
      ...row, 
      is_active: !!row.is_active,
      is_loyalty_only: !!row.is_loyalty_only
    };
  }

  static async delete(id: string): Promise<void> {
    await db.query('DELETE FROM coupons WHERE id = ?', [id]);
  }

  static async validateCoupon(code: string, orderAmount: number, totalQuantity: number, userId?: string): Promise<{ isValid: boolean; discount: number; error?: string }> {
    const coupon = await this.getByCode(code);
    if (!coupon) return { isValid: false, discount: 0, error: 'Invalid coupon code' };

    if (!coupon.is_active) return { isValid: false, discount: 0, error: 'Coupon is inactive' };

    if (coupon.is_loyalty_only) {
      if (!userId) return { isValid: false, discount: 0, error: 'This coupon is for loyalty members only' };
      
      const loyaltyResult = await db.query('SELECT points FROM loyalty_points WHERE user_id = ?', [userId]);
      if (loyaltyResult.rows.length === 0 || loyaltyResult.rows[0].points < 1) {
        return { isValid: false, discount: 0, error: 'This coupon is for loyalty members only' };
      }
    }

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return { isValid: false, discount: 0, error: 'Coupon has expired' };
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { isValid: false, discount: 0, error: 'Coupon usage limit reached' };
    }

    if (orderAmount < coupon.min_order_amount) {
      const branding = await AdminService.getBranding();
      const currency = branding?.currency_symbol || '£';
      return { isValid: false, discount: 0, error: `Minimum order amount of ${currency}${coupon.min_order_amount} required` };
    }

    const minQty = Number(coupon.min_quantity || 0);
    if (minQty > 0 && totalQuantity < minQty) {
      return { isValid: false, discount: 0, error: `Minimum quantity of ${minQty} items required` };
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
