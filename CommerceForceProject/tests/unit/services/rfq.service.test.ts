import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { RFQService } from '../../../server/services/rfq.service';
import { AuthService } from '../../../server/services/auth.service';
import { ProductService } from '../../../server/services/product.service';
import { WarehouseService } from '../../../server/services/warehouse.service';

describe('RFQService Unit Tests', () => {
  let userId: string;
  let productId: string;
  let warehouseId: string;

  beforeAll(async () => {
    await initDb();
    const { user } = await AuthService.register({
      email: 'rfq-test@example.com',
      password: 'password123',
      name: 'RFQ Tester'
    });
    userId = user.id;

    const product = await ProductService.create({
      sku: 'RFQ-PROD-001',
      name: 'RFQ Product',
      base_price: 100.00
    });
    productId = product.id;

    // Create a warehouse and set stock
    const warehouse = await WarehouseService.create({
      name: 'RFQ Warehouse',
      code: 'RFQ-WH',
      location: 'RFQ City'
    });
    warehouseId = warehouse.id;
    await WarehouseService.updateStock(warehouseId, productId, 1000);
  });

  it('should create a new RFQ', async () => {
    const rfq = await RFQService.create(userId, {
      items: [{ productId, quantity: 50, targetPrice: 80.00 }],
      notes: 'Bulk discount request'
    });

    expect(rfq.status).toBe('pending');
    expect(rfq.items?.length).toBe(1);
    expect(rfq.items![0].quantity).toBe(50);
    expect(rfq.items![0].target_price).toBe(80.00);
  });

  it('should allow admin to provide a quote', async () => {
    const rfqs = await RFQService.getByUserId(userId);
    const rfqId = rfqs[0].id;
    const rfqDetails = await RFQService.getById(rfqId);
    
    const quoted = await RFQService.updateQuote(rfqId, {
      items: [{ id: rfqDetails!.items![0].id, quotedPrice: 85.00 }]
    });

    expect(quoted.status).toBe('quoted');
    expect(quoted.total_quoted_amount).toBe(85.00 * 50);
  });

  it('should allow customer to accept a quote', async () => {
    const rfqs = await RFQService.getByUserId(userId);
    const rfqId = rfqs[0].id;
    
    const accepted = await RFQService.updateStatus(rfqId, 'accepted');
    expect(accepted.status).toBe('accepted');
  });

  it('should convert accepted RFQ to order', async () => {
    const rfqs = await RFQService.getByUserId(userId);
    const rfqId = rfqs[0].id;
    
    const result = await RFQService.convertToOrder(rfqId);
    expect(result.orderId).toBeDefined();

    const finalRfq = await RFQService.getById(rfqId);
    expect(finalRfq?.status).toBe('converted');
  });
});
