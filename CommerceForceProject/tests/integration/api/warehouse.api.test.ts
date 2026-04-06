import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';
import { AuthService } from '../../../server/services/auth.service';
import { ProductService } from '../../../server/services/product.service';
import db from '../../../server/db';

describe('Warehouse API Integration Tests', () => {
  let app: any;
  let adminToken: string;
  let productId: string;

  beforeAll(async () => {
    app = await createApp();
    
    // Create admin
    const adminEmail = 'admin-wh-test@example.com';
    const adminRoleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const adminRole = adminRoleResult.rows[0];
    await AuthService.register({
      email: adminEmail,
      password: 'adminpassword',
      name: 'Admin Warehouse'
    });
    await db.query('UPDATE users SET role_id = $1 WHERE email = $2', [adminRole.id, adminEmail]);
    const adminLogin = await AuthService.login({ email: adminEmail, password: 'adminpassword' });
    adminToken = adminLogin.token;

    // Create product
    const product = await ProductService.create({
      sku: 'API-WH-001',
      name: 'API WH Product',
      base_price: 15.00
    });
    productId = product.id;
  });

  let warehouseId: string;

  it('POST /api/warehouses should create a warehouse (Admin)', async () => {
    const response = await request(app)
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'API Warehouse',
        code: 'WH-API',
        location: 'API City'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.code).toBe('WH-API');
    warehouseId = response.body.id;
  });

  it('GET /api/warehouses should return list', async () => {
    const response = await request(app)
      .get('/api/warehouses')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /api/warehouses/:id/inventory should update stock', async () => {
    const response = await request(app)
      .post(`/api/warehouses/${warehouseId}/inventory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        quantity: 500,
        minStockLevel: 50
      });
    
    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(500);
  });

  it('GET /api/warehouses/:id/inventory should return inventory', async () => {
    const response = await request(app)
      .get(`/api/warehouses/${warehouseId}/inventory`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].product_id).toBe(productId);
  });
});
