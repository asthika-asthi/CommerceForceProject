import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { RFQ, RFQItem, RFQStatus } from '../../src/shared/types';
import { OrderService } from './order.service';
import { EmailService } from './email.service';
import { AuthService } from './auth.service';
import { CouponService } from './coupon.service';
import { WarehouseService } from './warehouse.service';
import { AdminService } from './admin.service';

export class RFQService {
  static async getAll(): Promise<RFQ[]> {
    const result = await db.query(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM rfqs r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);

    return result.rows.map(row => ({
      ...row,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        role: ''
      }
    }));
  }

  static async getById(id: string): Promise<RFQ | null> {
    const result = await db.query(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM rfqs r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [id]);
    const rfq = result.rows[0];

    if (!rfq) return null;

    const itemsResult = await db.query(`
      SELECT ri.*, p.name as product_name, p.sku as product_sku
      FROM rfq_items ri
      JOIN products p ON ri.product_id = p.id
      WHERE ri.rfq_id = ?
    `, [id]);
    const items = itemsResult.rows;

    return {
      ...rfq,
      user: {
        id: rfq.user_id,
        name: rfq.user_name,
        email: rfq.user_email,
        role: ''
      },
      items: items.map(item => ({
        ...item,
        product: {
          id: item.product_id,
          name: item.product_name,
          sku: item.product_sku,
          base_price: 0, // Not needed here
          is_active: true
        }
      }))
    };
  }

  static async getByUserId(userId: string): Promise<RFQ[]> {
    const result = await db.query('SELECT * FROM rfqs WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return result.rows;
  }

  static async create(userId: string, data: { items: { productId: string, quantity: number, targetPrice?: number }[], notes?: string }): Promise<RFQ> {
    const rfqId = uuidv4();

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await db.queryWithClient(client, `
        INSERT INTO rfqs (id, user_id, status, notes)
        VALUES (?, ?, ?, ?)
      `, [rfqId, userId, 'pending', data.notes || null]);

      for (const item of data.items) {
        await db.queryWithClient(client, `
          INSERT INTO rfq_items (id, rfq_id, product_id, quantity, target_price)
          VALUES (?, ?, ?, ?, ?)
        `, [uuidv4(), rfqId, item.productId, item.quantity, item.targetPrice || null]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const rfq = await this.getById(rfqId);

    // Send admin notification email
    try {
      const brandingConfig = await AdminService.getBranding();
      if (brandingConfig?.admin_email) {
        const user = await AuthService.getUserById(userId);
        await EmailService.sendEmail(
          brandingConfig.admin_email,
          `New RFQ Received - #${rfqId.substring(0, 8)}`,
          `A new RFQ has been submitted by ${user.name} (${user.email}).\n\nRFQ ID: ${rfqId}\nNotes: ${data.notes || 'None'}`
        );
      }
    } catch (err) {
      console.error('Failed to send admin RFQ notification email:', err);
    }

    return rfq!;
  }

  static async updateQuote(id: string, data: { items: { id: string, quotedPrice: number }[] }): Promise<RFQ> {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      let totalQuotedAmount = 0;
      for (const item of data.items) {
        await db.queryWithClient(client, 'UPDATE rfq_items SET quoted_price = ? WHERE id = ?', [item.quotedPrice, item.id]);
        
        // Fetch quantity to calculate total
        const rfqItemResult = await db.queryWithClient(client, 'SELECT quantity FROM rfq_items WHERE id = ?', [item.id]);
        const rfqItem = rfqItemResult.rows[0];
        totalQuotedAmount += Number(item.quotedPrice) * Number(rfqItem.quantity);
      }

      await db.queryWithClient(client, 'UPDATE rfqs SET status = ?, total_quoted_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['quoted', totalQuotedAmount, id]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const rfq = await this.getById(id);

    // Send quote notification email
    try {
      const user = await AuthService.getUserById(rfq!.user_id);
      const brandingConfig = await AdminService.getBranding();
      const currency = brandingConfig?.currency_symbol || '£';
      await EmailService.sendEmail(
        user.email,
        `Quote Ready - RFQ #${rfq!.id.substring(0, 8)}`,
        `Hi ${user.name},\n\nYour quote for RFQ #${rfq!.id.substring(0, 8)} is ready for review. Total quoted amount: ${currency}${rfq!.total_quoted_amount?.toLocaleString()}.`
      );
    } catch (err) {
      console.error('Failed to send quote notification email:', err);
    }

    return rfq!;
  }

  static async updateStatus(id: string, status: RFQStatus): Promise<RFQ> {
    await db.query('UPDATE rfqs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    const rfq = await this.getById(id);

    // Send status update email for acceptance/rejection
    if (status === 'accepted' || status === 'rejected') {
      try {
        const user = await AuthService.getUserById(rfq!.user_id);
        await EmailService.sendEmail(
          user.email,
          `RFQ Status Update - #${rfq!.id.substring(0, 8)}`,
          `Hi ${user.name},\n\nYour RFQ #${rfq!.id.substring(0, 8)} has been ${status.toUpperCase()}.`
        );
      } catch (err) {
        console.error('Failed to send RFQ status update email:', err);
      }
    }

    return rfq!;
  }

  static async convertToOrder(id: string, paymentMethod: 'prepaid' | 'credit' = 'prepaid', couponCode?: string): Promise<{ orderId: string }> {
    const rfq = await this.getById(id);
    if (!rfq || rfq.status !== 'accepted') {
      throw new Error('RFQ must be in accepted status to convert to order');
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const orderId = uuidv4();
      let subtotal = 0;

      // Calculate subtotal first
      for (const item of rfq.items!) {
        const unitPrice = Number(item.quoted_price || 0);
        subtotal += unitPrice * item.quantity;
      }

      let discountAmount = 0;
      if (couponCode) {
        const totalQuantity = rfq.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        const validation = await CouponService.validateCoupon(couponCode, subtotal, totalQuantity, rfq.user_id);
        if (!validation.isValid) {
          throw new Error(validation.error || 'Invalid coupon');
        }
        discountAmount = validation.discount;
        const coupon = await CouponService.getByCode(couponCode);
        if (coupon) {
          await CouponService.incrementUsage(coupon.id);
        }
      }

      const totalAmount = subtotal - discountAmount;

      // Check Credit Limit if payment method is credit
      if (paymentMethod === 'credit') {
        const userResult = await db.queryWithClient(client, 'SELECT available_credit FROM users WHERE id = ?', [rfq.user_id]);
        const user = userResult.rows[0];
        if (Number(user.available_credit) < totalAmount) {
          throw new Error('Insufficient credit limit');
        }
        await db.queryWithClient(client, 'UPDATE users SET available_credit = available_credit - ? WHERE id = ?', [totalAmount, rfq.user_id]);
      }

      // 1. Insert Order FIRST
      await db.queryWithClient(client, `
        INSERT INTO orders (id, user_id, status, total_amount, shipping_address, payment_method)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [orderId, rfq.user_id, 'pending', totalAmount, 'Converted from RFQ ' + id, paymentMethod]);

      // 2. Insert Order Items SECOND
      for (const item of rfq.items!) {
        const unitPrice = Number(item.quoted_price || 0);
        const totalPrice = unitPrice * item.quantity;

        await db.queryWithClient(client, `
          INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [uuidv4(), orderId, item.product_id, item.quantity, unitPrice, totalPrice]);
        
        // Deduct stock
        await WarehouseService.deductStock(item.product_id, item.quantity);
      }

      await db.queryWithClient(client, 'UPDATE rfqs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['converted', id]);
      
      // Award loyalty points
      const { LoyaltyService } = await import('./loyalty.service');
      await LoyaltyService.earnFromOrder(rfq.user_id, orderId, totalAmount, client);

      await client.query('COMMIT');
      return { orderId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
