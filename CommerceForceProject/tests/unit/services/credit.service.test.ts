import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { OrderService } from '../../../server/services/order.service';
import { AdminService } from '../../../server/services/admin.service';
import { AuthService } from '../../../server/services/auth.service';
import { ProductService } from '../../../server/services/product.service';
import { WarehouseService } from '../../../server/services/warehouse.service';
import db from '../../../server/db';

describe('B2B Credit Limit Unit Tests', () => {
  let userId: string;
  let productId: string;
  let warehouseId: string;

  beforeAll(async () => {
    await initDb();
    
    // Create user
    const auth = await AuthService.register({
      email: 'credit-test@example.com',
      password: 'password',
      name: 'Credit Test User'
    });
    userId = auth.user.id;

    // Create product
    const product = await ProductService.create({
      sku: 'CREDIT-PROD',
      name: 'Credit Product',
      base_price: 100
    });
    productId = product.id;

    // Create a warehouse and set stock
    const warehouse = await WarehouseService.create({
      name: 'Credit Warehouse',
      code: 'CREDIT-WH',
      location: 'Credit City'
    });
    warehouseId = warehouse.id;
    await WarehouseService.updateStock(warehouseId, productId, 1000);
  });

  it('should allow admin to set credit limit', async () => {
    await AdminService.updateUserCreditLimit(userId, 500);
    const user = await AuthService.getUserById(userId);
    expect(user?.credit_limit).toBe(500);
    expect(user?.available_credit).toBe(500);
  });

  it('should deduct credit when ordering with credit method', async () => {
    await OrderService.create(userId, {
      items: [{ productId, quantity: 2 }],
      paymentMethod: 'credit'
    });

    const user = await AuthService.getUserById(userId);
    expect(user?.available_credit).toBe(300); // 500 - (100 * 2)
  });

  it('should throw error if credit is insufficient', async () => {
    await expect(OrderService.create(userId, {
      items: [{ productId, quantity: 4 }], // 400 > 300
      paymentMethod: 'credit'
    })).rejects.toThrow('Insufficient credit limit');
  });

  it('should restore credit when order is cancelled', async () => {
    const order = await OrderService.create(userId, {
      items: [{ productId, quantity: 1 }],
      paymentMethod: 'credit'
    });
    
    const userBefore = await AuthService.getUserById(userId);
    expect(userBefore?.available_credit).toBe(200);

    await OrderService.updateStatus(order.id, 'cancelled');
    
    const userAfter = await AuthService.getUserById(userId);
    expect(userAfter?.available_credit).toBe(300);
  });
});
