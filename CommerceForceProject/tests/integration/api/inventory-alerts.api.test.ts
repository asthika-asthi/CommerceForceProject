import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../server';
import { AuthService } from '../../../server/services/auth.service';
import { ProductService } from '../../../server/services/product.service';
import { WarehouseService } from '../../../server/services/warehouse.service';
import db from '../../../server/db';

describe('Inventory Alerts API Integration Tests', () => {
  let app: any;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let productId: string;
  let warehouseId: string;

  beforeAll(async () => {
    app = await createApp();
    
    // Create admin
    const adminEmail = 'admin-alert@example.com';
    const adminRoleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const adminRole = adminRoleResult.rows[0];
    await AuthService.register({
      email: adminEmail,
      password: 'adminpassword',
      name: 'Admin Alert'
    });
    await db.query('UPDATE users SET role_id = $1 WHERE email = $2', [adminRole.id, adminEmail]);
    const adminLogin = await AuthService.login({ email: adminEmail, password: 'adminpassword' });
    adminToken = adminLogin.token;

    // Create user
    const userEmail = 'user-alert@example.com';
    const userAuth = await AuthService.register({
      email: userEmail,
      password: 'userpassword',
      name: 'User Alert'
    });
    userId = userAuth.user.id;
    userToken = userAuth.token;

    // Create warehouse
    const warehouse = await WarehouseService.create({
      name: 'API Alert Warehouse',
      code: 'API-ALERT-WH',
      location: 'API City'
    });
    warehouseId = warehouse.id;

    // Create product
    const product = await ProductService.create({
      sku: 'API-ALERT-PROD',
      name: 'API Alert Product',
      base_price: 20
    });
    productId = product.id;

    // Set initial stock and min level
    await WarehouseService.updateStock(warehouseId, productId, 10, 5);
  });

  it('POST /api/orders should trigger an alert when stock falls below minimum level', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 6 }], // 10 - 6 = 4, which is < 5
        paymentMethod: 'prepaid'
      });
    
    expect(response.status).toBe(201);
    
    const alertsRes = await request(app)
      .get('/api/warehouses/inventory/alerts')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(alertsRes.status).toBe(200);
    const latestAlert = alertsRes.body[0];
    expect(latestAlert.product_id).toBe(productId);
    expect(latestAlert.quantity).toBe(4);
  });

  it('PATCH /api/warehouses/inventory/alerts/:id/read should mark alert as read', async () => {
    const alertsRes = await request(app)
      .get('/api/warehouses/inventory/alerts')
      .set('Authorization', `Bearer ${adminToken}`);
    
    const alertId = alertsRes.body[0].id;
    
    const readRes = await request(app)
      .patch(`/api/warehouses/inventory/alerts/${alertId}/read`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(readRes.status).toBe(200);
    
    const updatedAlertsRes = await request(app)
      .get('/api/warehouses/inventory/alerts')
      .set('Authorization', `Bearer ${adminToken}`);
    
    const updatedAlert = updatedAlertsRes.body.find((a: any) => a.id === alertId);
    expect(updatedAlert.status).toBe('read');
  });
});
