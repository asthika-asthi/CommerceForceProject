import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';
import { AuthService } from '../../../server/services/auth.service';
import db from '../../../server/db';

describe('Loyalty API Integration Tests', () => {
  let app: any;
  let userToken: string;
  let adminToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await createApp();
    
    // Create user
    const userEmail = 'user-loyalty@example.com';
    const { user } = await AuthService.register({
      email: userEmail,
      password: 'password123',
      name: 'User Loyalty'
    });
    userId = user.id;
    const userLogin = await AuthService.login({ email: userEmail, password: 'password123' });
    userToken = userLogin.token;

    // Create admin
    const adminEmail = 'admin-loyalty@example.com';
    const adminRoleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const adminRole = adminRoleResult.rows[0];
    await AuthService.register({
      email: adminEmail,
      password: 'adminpassword',
      name: 'Admin Loyalty'
    });
    await db.query('UPDATE users SET role_id = $1 WHERE email = $2', [adminRole.id, adminEmail]);
    const adminLogin = await AuthService.login({ email: adminEmail, password: 'adminpassword' });
    adminToken = adminLogin.token;
  });

  it('GET /api/loyalty/my/balance should return user balance', async () => {
    const response = await request(app)
      .get('/api/loyalty/my/balance')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('balance');
  });

  it('POST /api/loyalty/adjust should allow admin to adjust points', async () => {
    const response = await request(app)
      .post('/api/loyalty/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId,
        points: 500,
        description: 'Welcome bonus'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify balance
    const balanceRes = await request(app)
      .get('/api/loyalty/my/balance')
      .set('Authorization', `Bearer ${userToken}`);
    expect(balanceRes.body.balance).toBe(500);
  });

  it('GET /api/loyalty/stats should return all stats for admin', async () => {
    const response = await request(app)
      .get('/api/loyalty/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some((s: any) => s.email === 'user-loyalty@example.com')).toBe(true);
  });
});
