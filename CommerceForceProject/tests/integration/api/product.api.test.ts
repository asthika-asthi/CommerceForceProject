import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';
import { AuthService } from '../../../server/services/auth.service';
import db from '../../../server/db';

describe('Product API Integration Tests', () => {
  let app: any;
  let adminToken: string;

  beforeAll(async () => {
    app = await createApp();
    
    // Create an admin user for testing
    const adminEmail = 'admin-prod-test@example.com';
    const existingResult = await db.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    const existing = existingResult.rows[0];
    
    if (!existing) {
      const adminRoleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);
      const adminRole = adminRoleResult.rows[0];
      const { token } = await AuthService.register({
        email: adminEmail,
        password: 'adminpassword',
        name: 'Admin User'
      });
      
      // Manually update role to admin if it defaulted to customer
      await db.query('UPDATE users SET role_id = $1 WHERE email = $2', [adminRole.id, adminEmail]);
      
      const loginRes = await AuthService.login({
        email: adminEmail,
        password: 'adminpassword'
      });
      adminToken = loginRes.token;
    } else {
      const loginRes = await AuthService.login({
        email: adminEmail,
        password: 'adminpassword'
      });
      adminToken = loginRes.token;
    }
  });

  const testProduct = {
    sku: 'API-SKU-001',
    name: 'API Test Product',
    base_price: 49.99
  };

  let createdId: string;

  it('GET /api/products should return list of products', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /api/products should fail without token', async () => {
    const response = await request(app)
      .post('/api/products')
      .send(testProduct);
    expect(response.status).toBe(401);
  });

  it('POST /api/products should create product with admin token', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testProduct);
    
    expect(response.status).toBe(201);
    expect(response.body.sku).toBe(testProduct.sku);
    createdId = response.body.id;
  });

  it('GET /api/products/:id should return the product', async () => {
    const response = await request(app).get(`/api/products/${createdId}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdId);
  });

  it('PUT /api/products/:id should update product', async () => {
    const response = await request(app)
      .put(`/api/products/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated via API' });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated via API');
  });

  it('DELETE /api/products/:id should remove product', async () => {
    const response = await request(app)
      .delete(`/api/products/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(204);
    
    const check = await request(app).get(`/api/products/${createdId}`);
    expect(check.status).toBe(404);
  });
});
