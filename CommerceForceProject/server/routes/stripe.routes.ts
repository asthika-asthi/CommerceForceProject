import { Router } from 'express';
import { StripeService } from '../services/stripe.service';
import { isAuthenticated } from '../middleware/auth.middleware';
import { AdminService } from '../services/admin.service';
import { PaymentMethodConfig } from '../../src/shared/types';

const router = Router();

router.post('/create-payment-intent', isAuthenticated, async (req, res) => {
  try {
    const { amount, items } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Optional stock validation if items are provided
    if (items && Array.isArray(items)) {
      const { WarehouseService } = await import('../services/warehouse.service');
      const { AuthService } = await import('../services/auth.service');
      const { OrderService } = await import('../services/order.service');

      for (const item of items) {
        const stock = await WarehouseService.getStockLevel(item.productId);
        if (stock < item.quantity) {
          const { ProductService } = await import('../services/product.service');
          const product = await ProductService.getById(item.productId);
          return res.status(400).json({ 
            error: `We're sorry, but we don't have enough ${product?.name || 'items'} in stock. We only have ${stock} available at the moment.` 
          });
        }
      }
    }

    // Get Stripe secret key from branding config
    const branding = await AdminService.getBranding();
    let secretKey: string | undefined;
    
    if (branding.payment_methods_config) {
      try {
        const methods: PaymentMethodConfig[] = JSON.parse(branding.payment_methods_config);
        const stripeMethod = methods.find(m => m.type === 'stripe');
        secretKey = stripeMethod?.config?.secretKey;
      } catch (e) {
        console.error('Failed to parse payment methods config:', e);
      }
    }

    const paymentIntent = await StripeService.createPaymentIntent(amount, secretKey);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
