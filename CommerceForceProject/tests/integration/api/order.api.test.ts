import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';
import { AuthService } from '../../../server/services/auth.service';
import { ProductService } from '../../../server/services/product.service';
import { WarehouseService } from '../../../server/services/warehouse.service';
import db from '../../../server/db';

describe('Order API Integration Tests', () => {
  let app: any;
  let adminToken: string;
  let userToken: string;
  let productId: string;
  let warehouseId: string;

  beforeAll(async () => {
    app = await createApp();
    
    // Create admin
    const adminEmail = 'admin-order-test@example.com';
    const adminRoleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const adminRole = adminRoleResult.rows[0];
    const adminRes = await AuthService.register({
      email: adminEmail,
      password: 'adminpassword',
      name: 'Admin Order'
    });
    await db.query('UPDATE users SET role_id = $1 WHERE email = $2', [adminRole.id, adminEmail]);
    const adminLogin = await AuthService.login({ email: adminEmail, password: 'adminpassword' });
    adminToken = adminLogin.token;

    // Create user
    const userRes = await AuthService.register({
      email: 'user-order-test@example.com',
      password: 'userpassword',
      name: 'User Order'
    });
    userToken = userRes.token;

    // Create product
    const product = await ProductService.create({
      sku: 'API-ORDER-001',
      name: 'API Order Product',
      base_price: 25.00
    });
    productId = product.id;

    // Create a warehouse and set stock
    const warehouse = await WarehouseService.create({
      name: 'API Order Warehouse',
      code: 'API-ORDER-WH',
      location: 'API Order City'
    });
    warehouseId = warehouse.id;
    await WarehouseService.updateStock(warehouseId, productId, 1000);
  });

  let createdOrderId: string;

  it('POST /api/orders should create an order', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 3 }],
        shippingAddress: '456 API Ave'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.total_amount).toBe(75.00);
    createdOrderId = response.body.id;
  });

  it('GET /api/orders should fail for non-admin', async () => {
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(403);
  });

  it('GET /api/orders should succeed for admin', async () => {
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /api/orders/my should return user orders', async () => {
    const response = await request(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('PATCH /api/orders/:id/status should update status (Admin)', async () => {
    const response = await request(app)
      .patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('shipped');
  });
});
