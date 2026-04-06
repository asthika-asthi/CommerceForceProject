import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { LoyaltyService } from '../../../server/services/loyalty.service';
import { AuthService } from '../../../server/services/auth.service';
import { OrderService } from '../../../server/services/order.service';
import { ProductService } from '../../../server/services/product.service';
import { WarehouseService } from '../../../server/services/warehouse.service';

describe('LoyaltyService Unit Tests', () => {
  let userId: string;
  let productId: string;
  let warehouseId: string;

  beforeAll(async () => {
    await initDb();
    const { user } = await AuthService.register({
      email: 'loyalty-test@example.com',
      password: 'password123',
      name: 'Loyalty Tester'
    });
    userId = user.id;

    const product = await ProductService.create({
      sku: 'LOYAL-001',
      name: 'Loyalty Product',
      base_price: 100.00
    });
    productId = product.id;

    // Create a warehouse and set stock
    const warehouse = await WarehouseService.create({
      name: 'Loyalty Warehouse',
      code: 'LOYALTY-WH',
      location: 'Loyalty City'
    });
    warehouseId = warehouse.id;
    await WarehouseService.updateStock(warehouseId, productId, 1000);
  });

  it('should start with zero balance', async () => {
    const balance = await LoyaltyService.getBalance(userId);
    expect(balance).toBe(0);
  });

  it('should earn points from an order', async () => {
    await OrderService.create(userId, {
      items: [{ productId, quantity: 2 }]
    });
    // $200 order should earn 200 points
    const balance = await LoyaltyService.getBalance(userId);
    expect(balance).toBe(200);

    const history = await LoyaltyService.getHistory(userId);
    expect(history.length).toBe(1);
    expect(history[0].type).toBe('earn');
    expect(history[0].points).toBe(200);
  });

  it('should allow manual adjustments', async () => {
    await LoyaltyService.addPoints(userId, 50, 'adjustment', 'Bonus points');
    const balance = await LoyaltyService.getBalance(userId);
    expect(balance).toBe(250);
  });

  it('should allow redeeming points', async () => {
    await LoyaltyService.addPoints(userId, -100, 'redeem', 'Redeemed for discount');
    const balance = await LoyaltyService.getBalance(userId);
    expect(balance).toBe(150);
  });
});
