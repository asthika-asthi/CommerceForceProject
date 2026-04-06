import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';

describe('Admin API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = await createApp();
  });

  it('GET /api/admin/stats should return dashboard data', async () => {
    const response = await request(app).get('/api/admin/stats');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalProducts');
  });

  it('GET /api/admin/branding should return branding config', async () => {
    const response = await request(app).get('/api/admin/branding');
    expect(response.status).toBe(200);
    expect(response.body.company_name).toBeDefined();
  });

  it('POST /api/admin/branding should update branding', async () => {
    const response = await request(app)
      .post('/api/admin/branding')
      .send({ company_name: 'Integration Test Corp' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const check = await request(app).get('/api/admin/branding');
    expect(check.body.company_name).toBe('Integration Test Corp');
  });

  it('GET /api/admin/features should return feature flags', async () => {
    const response = await request(app).get('/api/admin/features');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
