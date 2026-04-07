import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { CouponService } from '../../../server/services/coupon.service';
import db from '../../../server/db';

describe('CouponService Unit Tests', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('should create and retrieve a coupon', async () => {
    const coupon = await CouponService.create({
      code: 'TEST50',
      type: 'percentage',
      value: 50,
      min_order_amount: 100,
      min_quantity: 0,
      is_loyalty_only: false
    });

    expect(coupon.code).toBe('TEST50');
    expect(coupon.value).toBe(50);
    expect(coupon.type).toBe('percentage');
  });

  it('should validate a percentage coupon', async () => {
    const result = await CouponService.validateCoupon('TEST50', 200, 1);
    expect(result.isValid).toBe(true);
    expect(result.discount).toBe(100);
  });

  it('should fail validation if order amount is below minimum', async () => {
    const result = await CouponService.validateCoupon('TEST50', 50, 1);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Minimum order amount');
  });

  it('should validate a fixed amount coupon', async () => {
    await CouponService.create({
      code: 'FLAT20',
      type: 'fixed',
      value: 20,
      min_order_amount: 50,
      min_quantity: 0,
      is_loyalty_only: false
    });

    const result = await CouponService.validateCoupon('FLAT20', 100, 1);
    expect(result.isValid).toBe(true);
    expect(result.discount).toBe(20);
  });

  it('should respect min_quantity', async () => {
    await CouponService.create({
      code: 'QTY2',
      type: 'fixed',
      value: 10,
      min_order_amount: 0,
      min_quantity: 2,
      is_loyalty_only: false
    });

    const result1 = await CouponService.validateCoupon('QTY2', 100, 1);
    expect(result1.isValid).toBe(false);
    expect(result1.error).toContain('Minimum quantity of 2 items required');

    const result2 = await CouponService.validateCoupon('QTY2', 100, 2);
    expect(result2.isValid).toBe(true);
  });

  it('should respect usage limits', async () => {
    const coupon = await CouponService.create({
      code: 'ONCE',
      type: 'fixed',
      value: 10,
      min_order_amount: 0,
      min_quantity: 0,
      usage_limit: 1,
      is_loyalty_only: false
    });

    const result1 = await CouponService.validateCoupon('ONCE', 100, 1);
    expect(result1.isValid).toBe(true);

    await CouponService.incrementUsage(coupon.id);

    const result2 = await CouponService.validateCoupon('ONCE', 100, 1);
    expect(result2.isValid).toBe(false);
    expect(result2.error).toBe('Coupon usage limit reached');
  });

  it('should respect expiry date', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    await CouponService.create({
      code: 'EXPIRED',
      type: 'fixed',
      value: 10,
      min_order_amount: 0,
      min_quantity: 0,
      expiry_date: pastDate.toISOString(),
      is_loyalty_only: false
    });

    const result = await CouponService.validateCoupon('EXPIRED', 100, 1);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Coupon has expired');
  });
});
