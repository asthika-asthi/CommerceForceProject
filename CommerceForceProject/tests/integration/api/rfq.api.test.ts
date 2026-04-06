import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';
import { AuthService } from '../../../server/services/auth.service';
import { ProductService } from '../../../server/services/product.service';
import db from '../../../server/db';

describe('RFQ API Integration Tests', () => {
  let app: any;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    app = await createApp();
    
    // Create user
    const userEmail = 'user-rfq@example.com';
    const { user } = await AuthService.register({
      email: userEmail,
      password: 'password123',
      name: 'User RFQ'
    });
    userId = user.id;
    const userLogin = await AuthService.login({ email: userEmail, password: 'password123' });
    userToken = userLogin.token;

    // Create admin
    const adminEmail = 'admin-rfq@example.com';
    const adminRoleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const adminRole = adminRoleResult.rows[0];
    await AuthService.register({
      email: adminEmail,
      password: 'adminpassword',
      name: 'Admin RFQ'
    });
    await db.query('UPDATE users SET role_id = $1 WHERE email = $2', [adminRole.id, adminEmail]);
    const adminLogin = await AuthService.login({ email: adminEmail, password: 'adminpassword' });
    adminToken = adminLogin.token;

    // Create product
    const product = await ProductService.create({
      sku: 'RFQ-API-001',
      name: 'RFQ API Product',
      base_price: 50.00
    });
    productId = product.id;
  });

  it('POST /api/rfq should create a new RFQ', async () => {
    const response = await request(app)
      .post('/api/rfq')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 100, targetPrice: 40.00 }],
        notes: 'API test'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pending');
  });

  it('GET /api/rfq/my should return user RFQs', async () => {
    const response = await request(app)
      .get('/api/rfq/my')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('PATCH /api/rfq/:id/quote should allow admin to quote', async () => {
    const rfqs = await request(app)
      .get('/api/rfq/my')
      .set('Authorization', `Bearer ${userToken}`);
    const rfqId = rfqs.body[0].id;

    const rfqDetails = await request(app)
      .get(`/api/rfq/${rfqId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const response = await request(app)
      .patch(`/api/rfq/${rfqId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [{ id: rfqDetails.body.items[0].id, quotedPrice: 42.00 }]
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('quoted');
  });
});
