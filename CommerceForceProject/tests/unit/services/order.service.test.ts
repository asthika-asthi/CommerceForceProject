import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { OrderService } from '../../../server/services/order.service';
import { ProductService } from '../../../server/services/product.service';
import { AuthService } from '../../../server/services/auth.service';
import { WarehouseService } from '../../../server/services/warehouse.service';

describe('OrderService Unit Tests', () => {
  let userId: string;
  let productId: string;
  let warehouseId: string;

  beforeAll(async () => {
    await initDb();
    
    // Create a user
    const user = await AuthService.register({
      email: 'order-test@example.com',
      password: 'password123',
      name: 'Order Tester'
    });
    userId = user.user.id;

    // Create a product
    const product = await ProductService.create({
      sku: 'ORDER-TEST-001',
      name: 'Order Test Product',
      base_price: 50.00
    });
    productId = product.id;

    // Create a warehouse and set stock
    const warehouse = await WarehouseService.create({
      name: 'Test Warehouse',
      code: 'TEST-WH',
      location: 'Test City'
    });
    warehouseId = warehouse.id;
    await WarehouseService.updateStock(warehouseId, productId, 100);
  });

  let createdOrderId: string;

  it('should create a new order', async () => {
    const orderData = {
      items: [{ productId, quantity: 2 }],
      shippingAddress: '123 Test St'
    };

    const order = await OrderService.create(userId, orderData);
    expect(order.user_id).toBe(userId);
    expect(order.total_amount).toBe(100.00);
    expect(order.status).toBe('pending');
    expect(order.items?.length).toBe(1);
    expect(order.items?.[0].product_id).toBe(productId);
    createdOrderId = order.id;
  });

  it('should get order by id', async () => {
    const order = await OrderService.getById(createdOrderId);
    expect(order).not.toBeNull();
    expect(order?.id).toBe(createdOrderId);
    expect(order?.items?.length).toBe(1);
  });

  it('should list all orders', async () => {
    const orders = await OrderService.getAll();
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.some(o => o.id === createdOrderId)).toBe(true);
  });

  it('should update order status', async () => {
    const updated = await OrderService.updateStatus(createdOrderId, 'processing');
    expect(updated.status).toBe('processing');
  });

  it('should get orders by user id', async () => {
    const orders = await OrderService.getByUserId(userId);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].user_id).toBe(userId);
  });
});
