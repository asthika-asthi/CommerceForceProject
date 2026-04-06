import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { ProductService } from '../../../server/services/product.service';

describe('ProductService Unit Tests', () => {
  beforeAll(async () => {
    await initDb();
  });

  const testProduct = {
    sku: 'TEST-SKU-001',
    name: 'Test Product',
    description: 'A test product description',
    category: 'Electronics',
    base_price: 99.99,
    image_url: 'https://picsum.photos/seed/test/200/200'
  };

  let createdId: string;

  it('should create a new product', async () => {
    const product = await ProductService.create(testProduct);
    expect(product.sku).toBe(testProduct.sku);
    expect(product.name).toBe(testProduct.name);
    expect(product.base_price).toBe(testProduct.base_price);
    expect(product.id).toBeDefined();
    createdId = product.id;
  });

  it('should get product by id', async () => {
    const product = await ProductService.getById(createdId);
    expect(product).not.toBeNull();
    expect(product?.sku).toBe(testProduct.sku);
  });

  it('should get product by sku', async () => {
    const product = await ProductService.getBySku(testProduct.sku);
    expect(product).not.toBeNull();
    expect(product?.id).toBe(createdId);
  });

  it('should list all active products', async () => {
    const products = await ProductService.getAll();
    expect(products.length).toBeGreaterThan(0);
    expect(products.some(p => p.id === createdId)).toBe(true);
  });

  it('should update a product', async () => {
    const updatedName = 'Updated Test Product';
    const updated = await ProductService.update(createdId, { name: updatedName });
    expect(updated.name).toBe(updatedName);
    expect(updated.sku).toBe(testProduct.sku);
  });

  it('should delete a product', async () => {
    await ProductService.delete(createdId);
    const product = await ProductService.getById(createdId);
    expect(product).toBeNull();
  });
});
