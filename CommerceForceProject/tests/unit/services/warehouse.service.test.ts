import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { WarehouseService } from '../../../server/services/warehouse.service';
import { ProductService } from '../../../server/services/product.service';

describe('WarehouseService Unit Tests', () => {
  beforeAll(async () => {
    await initDb();
  });

  let warehouseId: string;
  let productId: string;

  it('should create a new warehouse', async () => {
    const warehouse = await WarehouseService.create({
      name: 'Central Distribution',
      code: 'WH-CENTRAL',
      location: 'London, UK'
    });
    expect(warehouse.name).toBe('Central Distribution');
    expect(warehouse.code).toBe('WH-CENTRAL');
    expect(warehouse.id).toBeDefined();
    warehouseId = warehouse.id;
  });

  it('should get all warehouses', async () => {
    const warehouses = await WarehouseService.getAll();
    expect(warehouses.length).toBeGreaterThan(0);
    expect(warehouses.some(w => w.id === warehouseId)).toBe(true);
  });

  it('should update warehouse details', async () => {
    const updated = await WarehouseService.update(warehouseId, { location: 'Manchester, UK' });
    expect(updated.location).toBe('Manchester, UK');
  });

  it('should manage inventory stock', async () => {
    // Create a product first
    const product = await ProductService.create({
      sku: 'INV-TEST-001',
      name: 'Inventory Test Product',
      base_price: 10.00
    });
    productId = product.id;

    const inventory = await WarehouseService.updateStock(warehouseId, productId, 100, 10);
    expect(inventory.quantity).toBe(100);
    expect(inventory.min_stock_level).toBe(10);
    expect(inventory.product_id).toBe(productId);
  });

  it('should get inventory by warehouse', async () => {
    const inventory = await WarehouseService.getInventoryByWarehouse(warehouseId);
    expect(inventory.length).toBeGreaterThan(0);
    expect(inventory[0].product_id).toBe(productId);
  });

  it('should calculate total stock level across warehouses', async () => {
    const total = await WarehouseService.getStockLevel(productId);
    expect(total).toBe(100);
  });
});
