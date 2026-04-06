import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';
import { AuthService } from '../../../server/services/auth.service';
import { ProductService } from '../../../server/services/product.service';
import { CouponService } from '../../../server/services/coupon.service';
import { WarehouseService } from '../../../server/services/warehouse.service';
import db from '../../../server/db';

describe('Coupon API Integration Tests', () => {
  let app: any;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let productId: string;
  let warehouseId: string;

  beforeAll(async () => {
    app = await createApp();
    
    // Create admin
    const adminEmail = 'admin-coupon@example.com';
    const adminRoleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const adminRole = adminRoleResult.rows[0];
    await AuthService.register({
      email: adminEmail,
      password: 'adminpassword',
      name: 'Admin Coupon'
    });
    await db.query('UPDATE users SET role_id = $1 WHERE email = $2', [adminRole.id, adminEmail]);
    const adminLogin = await AuthService.login({ email: adminEmail, password: 'adminpassword' });
    adminToken = adminLogin.token;

    // Create user
    const userEmail = 'user-coupon@example.com';
    const userAuth = await AuthService.register({
      email: userEmail,
      password: 'userpassword',
      name: 'User Coupon'
    });
    userId = userAuth.user.id;
    userToken = userAuth.token;

    // Create product
    const product = await ProductService.create({
      sku: 'COUPON-PROD',
      name: 'Coupon Product',
      base_price: 100
    });
    productId = product.id;

    // Create a warehouse and set stock
    const warehouse = await WarehouseService.create({
      name: 'API Coupon Warehouse',
      code: 'API-COUPON-WH',
      location: 'API Coupon City'
    });
    warehouseId = warehouse.id;
    await WarehouseService.updateStock(warehouseId, productId, 1000);
  });

  it('POST /api/coupons should create a coupon (Admin)', async () => {
    const response = await request(app)
      .post('/api/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        min_order_amount: 50
      });
    
    expect(response.status).toBe(201);
    expect(response.body.code).toBe('SAVE10');
  });

  it('GET /api/coupons/validate/:code should validate a coupon', async () => {
    const response = await request(app)
      .get('/api/coupons/validate/SAVE10?amount=100')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.isValid).toBe(true);
    expect(response.body.discount).toBe(10);
  });

  it('POST /api/orders should apply coupon discount', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 2 }], // 200
        couponCode: 'SAVE10' // 10% of 200 = 20
      });
    
    expect(response.status).toBe(201);
    expect(response.body.total_amount).toBe(180); // 200 - 20
  });

  it('POST /api/orders should fail if coupon is invalid', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 1 }],
        couponCode: 'INVALID'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid coupon code');
  });
});
