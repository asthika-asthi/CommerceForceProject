import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';

describe('Auth API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
  });

  const testUser = {
    email: 'api-test@example.com',
    password: 'password123',
    name: 'API Test User'
  };

  it('POST /api/auth/register should create a user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(testUser.email);
    expect(response.body.token).toBeDefined();
  });

  it('POST /api/auth/login should return a token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('GET /api/auth/me should return current user', async () => {
    // First login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    const token = loginRes.body.token;

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(testUser.email);
  });

  it('GET /api/auth/me should fail with invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
  });
});
