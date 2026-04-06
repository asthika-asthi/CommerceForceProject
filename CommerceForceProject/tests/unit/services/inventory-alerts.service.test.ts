import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { WarehouseService } from '../../../server/services/warehouse.service';
import { ProductService } from '../../../server/services/product.service';
import db from '../../../server/db';

describe('Inventory Alerts Unit Tests', () => {
  let warehouseId: string;
  let productId: string;

  beforeAll(async () => {
    await initDb();
    
    // Create warehouse
    const warehouse = await WarehouseService.create({
      name: 'Alert Warehouse',
      code: 'ALERT-WH',
      location: 'Test City'
    });
    warehouseId = warehouse.id;

    // Create product
    const product = await ProductService.create({
      sku: 'ALERT-PROD',
      name: 'Alert Product',
      base_price: 10
    });
    productId = product.id;
  });

  it('should trigger an alert when stock falls below minimum level', async () => {
    // Set initial stock and min level
    await WarehouseService.updateStock(warehouseId, productId, 10, 5);
    
    // Deduct stock to trigger alert
    await WarehouseService.deductStock(productId, 6); // 10 - 6 = 4, which is < 5
    
    const alerts = await WarehouseService.getAlerts();
    const latestAlert = alerts[0];
    
    expect(latestAlert.product_id).toBe(productId);
    expect(latestAlert.warehouse_id).toBe(warehouseId);
    expect(latestAlert.quantity).toBe(4);
    expect(latestAlert.min_stock_level).toBe(5);
    expect(latestAlert.status).toBe('unread');
  });

  it('should mark alert as read', async () => {
    const alerts = await WarehouseService.getAlerts();
    const alertId = alerts[0].id;
    
    await WarehouseService.markAlertAsRead(alertId);
    
    const updatedAlerts = await WarehouseService.getAlerts();
    const updatedAlert = updatedAlerts.find(a => a.id === alertId);
    expect(updatedAlert?.status).toBe('read');
  });

  it('should throw error if stock is insufficient', async () => {
    await expect(WarehouseService.deductStock(productId, 100)).rejects.toThrow(`Insufficient stock for product ${productId}`);
  });
});
