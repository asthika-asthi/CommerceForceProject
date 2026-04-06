import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';
import { AuthService } from '../../../server/services/auth.service';
import { EmailService } from '../../../server/services/email.service';
import db from '../../../server/db';

describe('Email API Integration Tests', () => {
  let app: any;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    app = await createApp();
    
    // Create admin
    const adminEmail = 'admin-email@example.com';
    const adminRoleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const adminRole = adminRoleResult.rows[0];
    await AuthService.register({
      email: adminEmail,
      password: 'adminpassword',
      name: 'Admin Email'
    });
    await db.query('UPDATE users SET role_id = $1 WHERE email = $2', [adminRole.id, adminEmail]);
    const adminLogin = await AuthService.login({ email: adminEmail, password: 'adminpassword' });
    adminToken = adminLogin.token;

    // Create user
    const userEmail = 'user-email@example.com';
    await AuthService.register({
      email: userEmail,
      password: 'userpassword',
      name: 'User Email'
    });
    const userLogin = await AuthService.login({ email: userEmail, password: 'userpassword' });
    userToken = userLogin.token;

    // Seed some logs
    await EmailService.sendEmail('test@example.com', 'Subject 1', 'Body 1');
    await EmailService.sendEmail('test@example.com', 'Subject 2', 'Body 2');
  });

  it('GET /api/email/logs should return all logs for admin', async () => {
    const response = await request(app)
      .get('/api/email/logs')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
    expect(response.body[0]).toHaveProperty('recipient');
    expect(response.body[0]).toHaveProperty('subject');
  });

  it('GET /api/email/logs should be forbidden for regular user', async () => {
    const response = await request(app)
      .get('/api/email/logs')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(403);
  });

  it('GET /api/email/logs/:recipient should return logs for a specific recipient', async () => {
    const response = await request(app)
      .get('/api/email/logs/test@example.com')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
    expect(response.body.every((log: any) => log.recipient === 'test@example.com')).toBe(true);
  });
});
