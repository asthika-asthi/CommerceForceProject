import Stripe from 'stripe';

let stripeClient: Stripe | null = null;
let currentSecretKey: string | null = null;

export function getStripe(secretKey?: string): Stripe {
  const key = secretKey || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe Secret Key is required. Please configure it in the Admin panel or set STRIPE_SECRET_KEY environment variable.');
  }

  // If the key has changed, re-initialize the client
  if (!stripeClient || currentSecretKey !== key) {
    stripeClient = new Stripe(key);
    currentSecretKey = key;
  }
  
  return stripeClient;
}

export class StripeService {
  static async createPaymentIntent(amount: number, secretKey?: string, currency: string = 'gbp') {
    const stripe = getStripe(secretKey);
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amounts in cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }
}
