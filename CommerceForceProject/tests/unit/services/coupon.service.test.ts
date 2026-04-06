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
      min_order_amount: 100
    });

    expect(coupon.code).toBe('TEST50');
    expect(coupon.value).toBe(50);
    expect(coupon.type).toBe('percentage');
  });

  it('should validate a percentage coupon', async () => {
    const result = await CouponService.validateCoupon('TEST50', 200);
    expect(result.isValid).toBe(true);
    expect(result.discount).toBe(100);
  });

  it('should fail validation if order amount is below minimum', async () => {
    const result = await CouponService.validateCoupon('TEST50', 50);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Minimum order amount');
  });

  it('should validate a fixed amount coupon', async () => {
    await CouponService.create({
      code: 'FLAT20',
      type: 'fixed',
      value: 20,
      min_order_amount: 50
    });

    const result = await CouponService.validateCoupon('FLAT20', 100);
    expect(result.isValid).toBe(true);
    expect(result.discount).toBe(20);
  });

  it('should respect usage limits', async () => {
    const coupon = await CouponService.create({
      code: 'ONCE',
      type: 'fixed',
      value: 10,
      min_order_amount: 0,
      usage_limit: 1
    });

    const result1 = await CouponService.validateCoupon('ONCE', 100);
    expect(result1.isValid).toBe(true);

    await CouponService.incrementUsage(coupon.id);

    const result2 = await CouponService.validateCoupon('ONCE', 100);
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
      expiry_date: pastDate.toISOString()
    });

    const result = await CouponService.validateCoupon('EXPIRED', 100);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Coupon has expired');
  });
});
