import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { Warehouse, Inventory } from '../../src/shared/types';
import { EmailService } from './email.service';

export class WarehouseService {
  // Warehouse CRUD
  static async getAll(): Promise<Warehouse[]> {
    const result = await db.query('SELECT * FROM warehouses ORDER BY name ASC');
    return result.rows.map(row => ({ ...row, is_active: !!row.is_active }));
  }

  static async getById(id: string): Promise<Warehouse | null> {
    const result = await db.query('SELECT * FROM warehouses WHERE id = ?', [id]);
    const row = result.rows[0];
    if (!row) return null;
    return { ...row, is_active: !!row.is_active };
  }

  static async create(data: Omit<Warehouse, 'id' | 'is_active'>): Promise<Warehouse> {
    const id = uuidv4();
    await db.query(`
      INSERT INTO warehouses (id, name, code, location, is_active)
      VALUES (?, ?, ?, ?, 1)
    `, [id, data.name, data.code, data.location]);
    const warehouse = await this.getById(id);
    return warehouse!;
  }

  static async update(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const sets: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
    if (data.code !== undefined) { sets.push('code = ?'); values.push(data.code); }
    if (data.location !== undefined) { sets.push('location = ?'); values.push(data.location); }
    if (data.is_active !== undefined) { sets.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (sets.length > 0) {
      values.push(id);
      await db.query(`UPDATE warehouses SET ${sets.join(', ')} WHERE id = ?`, values);
    }

    const warehouse = await this.getById(id);
    return warehouse!;
  }

  // Inventory Management
  static async getInventoryByWarehouse(warehouseId: string): Promise<Inventory[]> {
    const result = await db.query(`
      SELECT 
        p.id as product_id,
        p.name as product_name, 
        p.sku as product_sku,
        p.allow_direct_buy,
        i.id as inventory_id,
        COALESCE(i.quantity, 0) as quantity,
        COALESCE(i.min_stock_level, 0) as min_stock_level,
        COALESCE(i.updated_at, CURRENT_TIMESTAMP) as updated_at
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.warehouse_id = ?
      WHERE p.is_active = 1
      ORDER BY p.name ASC
    `, [warehouseId]);

    return result.rows.map(row => ({
      ...row,
      id: row.inventory_id || `temp-${row.product_id}`,
      warehouse_id: warehouseId,
      product_id: row.product_id,
      quantity: Number(row.quantity),
      min_stock_level: Number(row.min_stock_level),
      updated_at: row.updated_at,
      product: {
        id: row.product_id,
        name: row.product_name,
        sku: row.product_sku,
        allow_direct_buy: Boolean(row.allow_direct_buy),
        base_price: 0,
        is_active: true
      }
    }));
  }

  static async updateStock(warehouseId: string, productId: string, quantity: number, minStockLevel?: number): Promise<Inventory> {
    const existingResult = await db.query('SELECT id FROM inventory WHERE warehouse_id = ? AND product_id = ?', [warehouseId, productId]);
    const existing = existingResult.rows[0];

    if (existing) {
      const sets = ['quantity = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const values = [quantity];
      
      if (minStockLevel !== undefined) {
        sets.push('min_stock_level = ?');
        values.push(minStockLevel);
      }
      
      values.push(existing.id);
      await db.query(`UPDATE inventory SET ${sets.join(', ')} WHERE id = ?`, values);
    } else {
      const id = uuidv4();
      await db.query(`
        INSERT INTO inventory (id, warehouse_id, product_id, quantity, min_stock_level)
        VALUES (?, ?, ?, ?, ?)
      `, [id, warehouseId, productId, quantity, minStockLevel || 0]);
    }

    const inventoryResult = await db.query(`
      SELECT i.*, p.name as product_name, p.sku as product_sku
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.warehouse_id = ? AND i.product_id = ?
    `, [warehouseId, productId]);
    const inventory = inventoryResult.rows[0];

    // Check for low stock alert
    if (inventory.quantity <= inventory.min_stock_level) {
      const warehouse = await this.getById(warehouseId);
      
      // Log alert to DB
      const alertId = uuidv4();
      await db.query(`
        INSERT INTO inventory_alerts (id, warehouse_id, product_id, quantity, min_stock_level)
        VALUES (?, ?, ?, ?, ?)
      `, [alertId, warehouseId, productId, inventory.quantity, inventory.min_stock_level]);

      // In a real app, we'd send this to the warehouse manager or admin
      try {
        await EmailService.sendEmail(
          'admin@commerceforce.com',
          `Low Stock Alert: ${inventory.product_name}`,
          `Stock for ${inventory.product_name} (SKU: ${inventory.product_sku}) in warehouse ${warehouse?.name} has fallen to ${inventory.quantity}, which is at or below the minimum level of ${inventory.min_stock_level}.`
        );
      } catch (err) {
        console.error('Failed to send low stock email:', err);
      }
    }

    return inventory;
  }

  static async getAlerts(): Promise<any[]> {
    const result = await db.query(`
      SELECT a.*, p.name as product_name, p.sku as product_sku, w.name as warehouse_name
      FROM inventory_alerts a
      JOIN products p ON a.product_id = p.id
      JOIN warehouses w ON a.warehouse_id = w.id
      ORDER BY a.created_at DESC
    `);
    return result.rows;
  }

  static async markAlertAsRead(id: string): Promise<void> {
    await db.query('UPDATE inventory_alerts SET status = ? WHERE id = ?', ['read', id]);
  }

  static async getStockLevel(productId: string): Promise<number> {
    const result = await db.query('SELECT SUM(quantity) as total FROM inventory WHERE product_id = ?', [productId]);
    return Number(result.rows[0]?.total || 0);
  }

  static async deductStock(productId: string, quantity: number): Promise<void> {
    const result = await db.query(`
      SELECT * FROM inventory 
      WHERE product_id = ? AND quantity >= ? 
      ORDER BY quantity DESC LIMIT 1
    `, [productId, quantity]);
    const inventory = result.rows[0];

    if (!inventory) {
      // If no single warehouse has enough, we could split it, but for now let's throw
      throw new Error(`Insufficient stock for product ${productId}`);
    }

    const newQuantity = inventory.quantity - quantity;
    await this.updateStock(inventory.warehouse_id, productId, newQuantity);
  }
}
