import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { Order, OrderItem, OrderStatus } from '../../src/shared/types';
import { LoyaltyService } from './loyalty.service';
import { EmailService } from './email.service';
import { AuthService } from './auth.service';
import { CouponService } from './coupon.service';
import { WarehouseService } from './warehouse.service';

export class OrderService {
  static async getAll(): Promise<Order[]> {
    const result = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    return result.rows.map(row => ({
      ...row,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        role: '' // Role not needed for order display
      }
    }));
  }

  static async getById(id: string): Promise<Order | null> {
    const result = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);
    const order = result.rows[0];

    if (!order) return null;

    const itemsResult = await db.query(`
      SELECT oi.*, p.name as product_name, p.sku as product_sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);
    const items = itemsResult.rows;

    return {
      ...order,
      user: {
        id: order.user_id,
        name: order.user_name,
        email: order.user_email,
        role: ''
      },
      items: items.map(item => ({
        ...item,
        product: {
          id: item.product_id,
          name: item.product_name,
          sku: item.product_sku,
          base_price: item.unit_price,
          is_active: true
        }
      }))
    };
  }

  static async create(userId: string, data: { items: { productId: string, quantity: number }[], shippingAddress?: string, paymentMethod?: 'prepaid' | 'credit' | 'credit_card' | 'paypal' | 'razorpay', couponCode?: string }): Promise<Order> {
    const orderId = uuidv4();
    let subtotal = 0;
    const paymentMethod = data.paymentMethod || 'prepaid';

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Calculate total and prepare items
      const itemsToInsert: any[] = [];
      for (const item of data.items) {
        const productResult = await db.queryWithClient(client, 'SELECT base_price, sale_percentage FROM products WHERE id = ?', [item.productId]);
        const product = productResult.rows[0];
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const basePrice = Number(product.base_price);
        const salePercentage = Number(product.sale_percentage || 0);
        const unitPrice = salePercentage > 0 ? basePrice * (1 - salePercentage / 100) : basePrice;
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        itemsToInsert.push({
          id: uuidv4(),
          order_id: orderId,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice
        });
      }

      let discountAmount = 0;
      let couponId: string | null = null;

      if (data.couponCode) {
        const validation = await CouponService.validateCoupon(data.couponCode, subtotal, userId);
        if (!validation.isValid) {
          throw new Error(validation.error || 'Invalid coupon');
        }
        discountAmount = validation.discount;
        const coupon = await CouponService.getByCode(data.couponCode);
        if (coupon) {
          couponId = coupon.id;
          await CouponService.incrementUsage(coupon.id);
        }
      }

      const totalAmount = subtotal - discountAmount;

      // Check Credit Limit if payment method is credit
      if (paymentMethod === 'credit') {
        const userResult = await db.queryWithClient(client, 'SELECT available_credit FROM users WHERE id = ?', [userId]);
        const user = userResult.rows[0];
        if (Number(user.available_credit) < totalAmount) {
          throw new Error('Insufficient credit limit');
        }
        await db.queryWithClient(client, 'UPDATE users SET available_credit = available_credit - ? WHERE id = ?', [totalAmount, userId]);
      }

      // Insert Order
      await db.queryWithClient(client, `
        INSERT INTO orders (id, user_id, status, total_amount, shipping_address, payment_method)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [orderId, userId, 'pending', totalAmount, data.shippingAddress, paymentMethod]);

      // Insert Order Items
      for (const item of itemsToInsert) {
        await db.queryWithClient(client, `
          INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [item.id, item.order_id, item.product_id, item.quantity, item.unit_price, item.total_price]);
        
        // Deduct stock
        await WarehouseService.deductStock(item.product_id, item.quantity);
      }

      // Award loyalty points
      await LoyaltyService.earnFromOrder(userId, orderId, totalAmount, client);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const order = await this.getById(orderId);

    // Send order confirmation email
    try {
      const user = await AuthService.getUserById(userId);
      await EmailService.sendEmail(
        user.email,
        `Order Confirmation - #${order!.id.substring(0, 8)}`,
        `Hi ${user.name},\n\nThank you for your order! Your order #${order!.id.substring(0, 8)} for $${order!.total_amount.toLocaleString()} has been received and is being processed. Payment Method: ${paymentMethod.toUpperCase()}`
      );
    } catch (err) {
      console.error('Failed to send order confirmation email:', err);
    }

    return order!;
  }

  static async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const orderBefore = await this.getById(id);
    if (!orderBefore) throw new Error('Order not found');

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      await db.queryWithClient(client, 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

      // If cancelled and was paid by credit, restore credit
      if (status === 'cancelled' && orderBefore.status !== 'cancelled' && orderBefore.payment_method === 'credit') {
        await db.queryWithClient(client, 'UPDATE users SET available_credit = available_credit + ? WHERE id = ?', [orderBefore.total_amount, orderBefore.user_id]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const order = await this.getById(id);

    // Send status update email
    try {
      const user = await AuthService.getUserById(order!.user_id);
      await EmailService.sendEmail(
        user.email,
        `Order Status Update - #${order!.id.substring(0, 8)}`,
        `Hi ${user.name},\n\nYour order #${order!.id.substring(0, 8)} status has been updated to: ${status.toUpperCase()}.`
      );
    } catch (err) {
      console.error('Failed to send order status update email:', err);
    }

    return order!;
  }

  static async getByUserId(userId: string): Promise<Order[]> {
    const result = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return result.rows;
  }
}
