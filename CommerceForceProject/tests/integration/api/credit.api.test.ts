import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';
import { AuthService } from '../../../server/services/auth.service';
import { ProductService } from '../../../server/services/product.service';
import { WarehouseService } from '../../../server/services/warehouse.service';
import db from '../../../server/db';

describe('B2B Credit Limit API Integration Tests', () => {
  let app: any;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let productId: string;
  let warehouseId: string;

  beforeAll(async () => {
    app = await createApp();
    
    // Create admin
    const adminEmail = 'admin-credit@example.com';
    const adminRoleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const adminRole = adminRoleResult.rows[0];
    await AuthService.register({
      email: adminEmail,
      password: 'adminpassword',
      name: 'Admin Credit'
    });
    await db.query('UPDATE users SET role_id = $1 WHERE email = $2', [adminRole.id, adminEmail]);
    const adminLogin = await AuthService.login({ email: adminEmail, password: 'adminpassword' });
    adminToken = adminLogin.token;

    // Create user
    const userEmail = 'user-credit@example.com';
    const userAuth = await AuthService.register({
      email: userEmail,
      password: 'userpassword',
      name: 'User Credit'
    });
    userId = userAuth.user.id;
    userToken = userAuth.token;

    // Create product
    const product = await ProductService.create({
      sku: 'API-CREDIT-PROD',
      name: 'API Credit Product',
      base_price: 50
    });
    productId = product.id;

    // Create a warehouse and set stock
    const warehouse = await WarehouseService.create({
      name: 'API Credit Warehouse',
      code: 'API-CREDIT-WH',
      location: 'API Credit City'
    });
    warehouseId = warehouse.id;
    await WarehouseService.updateStock(warehouseId, productId, 1000);
  });

  it('POST /api/admin/users/:id/credit-limit should update limit (Admin)', async () => {
    const response = await request(app)
      .post(`/api/admin/users/${userId}/credit-limit`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ creditLimit: 200 });
    
    expect(response.status).toBe(200);
    
    const user = await AuthService.getUserById(userId);
    expect(user?.credit_limit).toBe(200);
    expect(user?.available_credit).toBe(200);
  });

  it('POST /api/orders should deduct credit when paymentMethod is credit', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 2 }], // 100
        paymentMethod: 'credit'
      });
    
    expect(response.status).toBe(201);
    
    const user = await AuthService.getUserById(userId);
    expect(user?.available_credit).toBe(100);
  });

  it('POST /api/orders should fail if credit is insufficient', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 3 }], // 150 > 100
        paymentMethod: 'credit'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Insufficient credit limit');
  });
});
