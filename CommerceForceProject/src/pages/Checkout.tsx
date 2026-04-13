import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { ShoppingBag, ArrowLeft, CreditCard, Truck, CheckCircle2, Loader2, AlertCircle, Banknote, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FeatureFlag, PaymentMethodConfig } from '../shared/types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '../components/StripePaymentForm';

export const Checkout = ({ onBack }: { onBack: () => void }) => {
  const { items, totalPrice, clearCart } = useCart();
  const { token, user } = useAuth();
  const { config: brandingConfig } = useBranding();
  const currency = brandingConfig?.currency_symbol || '£';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [error, setError] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState('');

  const b2bEnabled = Boolean(features.find(f => f.feature_key === 'b2b_enabled')?.enabled ?? true);
  
  const availablePaymentMethods: PaymentMethodConfig[] = React.useMemo(() => {
    if (!brandingConfig?.payment_methods_config) return [];
    try {
      const methods: PaymentMethodConfig[] = JSON.parse(brandingConfig.payment_methods_config);
      return methods
        .filter(m => m.enabled)
        .filter(m => {
          if (m.type === 'credit_limit') {
            return b2bEnabled && (user?.credit_limit || 0) > 0;
          }
          return true;
        })
        .sort((a, b) => a.order - b.order);
    } catch (e) {
      return [];
    }
  }, [brandingConfig, b2bEnabled, user]);

  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(availablePaymentMethods[0].id);
    }
  }, [availablePaymentMethods]);

  useEffect(() => {
    const stripeMethod = availablePaymentMethods.find(m => m.type === 'stripe');
    if (stripeMethod?.config?.publicKey) {
      setStripePromise(loadStripe(stripeMethod.config.publicKey));
    }
  }, [availablePaymentMethods]);

  useEffect(() => {
    if (paymentMethod) {
      const method = availablePaymentMethods.find(m => m.id === paymentMethod);
      if (method?.type === 'stripe' && token) {
        fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount: totalPrice - couponDiscount })
        })
        .then(res => res.json())
        .then(data => setClientSecret(data.clientSecret))
        .catch(err => console.error('Failed to create payment intent:', err));
      }
    }
  }, [paymentMethod, totalPrice, couponDiscount, token, availablePaymentMethods]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const res = await fetch(`/api/coupons/validate/${couponCode}?amount=${totalPrice}&quantity=${totalQuantity}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.isValid) {
        setCouponDiscount(data.discount);
      } else {
        setCouponError(data.error || 'Invalid coupon');
        setCouponDiscount(0);
      }
    } catch (err) {
      setCouponError('Failed to validate coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetch('/api/admin/features', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setFeatures(Array.isArray(data) ? data : []))
        .catch(err => console.error('Failed to fetch features:', err));
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: items
            .filter(item => item.product)
            .map(item => ({
              productId: item.product.id,
              quantity: item.quantity
            })),
          shippingAddress,
          paymentMethod,
          couponCode: couponDiscount > 0 ? couponCode : undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to place order');
      }

      setOrderComplete(true);
      clearCart();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[32px] border border-[#141414]/5 shadow-sm"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-[#141414] mb-4">Order Confirmed!</h2>
          <p className="text-[#141414]/60 mb-8 max-w-md mx-auto">
            Thank you for your purchase. Your order has been received and is being processed. 
            You'll receive a confirmation email shortly.
          </p>
          <button
            onClick={onBack}
            className="bg-[#141414] text-white px-8 py-3 rounded-xl font-medium hover:bg-black transition-all"
          >
            Return to Products
          </button>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-20 h-20 bg-[#141414]/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={32} className="opacity-20" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-sm opacity-50 mb-8 max-w-xs mx-auto">
          Add some products to your cart before checking out to see the order summary.
        </p>
        <button 
          onClick={onBack}
          className="bg-[#141414] text-white px-8 py-3 rounded-xl font-medium hover:bg-black transition-all"
        >
          Go to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-[#141414]/60 hover:text-[#141414] mb-8 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Checkout Form */}
        <div className="lg:col-span-7 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[#141414] mb-6 flex items-center gap-3">
              <Truck size={24} className="text-[#141414]/40" />
              Shipping Details
            </h2>
            <div className="bg-white p-6 rounded-[24px] border border-[#141414]/5 shadow-sm">
              <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-2 ml-1">
                Shipping Address
              </label>
              <textarea
                required
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                placeholder="Enter your full delivery address..."
                className="w-full px-4 py-3 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all h-32 resize-none"
              />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#141414] mb-6 flex items-center gap-3">
              <CreditCard size={24} className="text-[#141414]/40" />
              Payment Method
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePaymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-6 rounded-[24px] border-2 text-left transition-all ${
                    paymentMethod === method.id 
                      ? 'border-[#141414] bg-[#141414]/5' 
                      : 'border-[#141414]/5 bg-white hover:border-[#141414]/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-black/5 rounded-lg">
                      {method.type === 'cash' && <Banknote size={18} />}
                      {method.type === 'credit_limit' && <Settings size={18} />}
                      {method.type === 'stripe' && <CreditCard size={18} />}
                      {method.type === 'paypal' && <CreditCard size={18} />}
                      {method.type === 'razorpay' && <CreditCard size={18} />}
                    </div>
                    <div className="font-bold">{method.name}</div>
                  </div>
                  <div className="text-xs text-[#141414]/60">
                    {method.type === 'credit_limit' 
                      ? `Charge to your account credit (${currency}${Number(user?.available_credit || 0).toFixed(2)} available)`
                      : method.description}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {paymentMethod && availablePaymentMethods.find(m => m.id === paymentMethod)?.type === 'stripe' ? (
            stripePromise && clientSecret ? (
              <section className="bg-white p-8 rounded-[32px] border border-[#141414]/5 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-lg font-bold mb-6">Card Details</h3>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm 
                    amount={totalPrice - couponDiscount}
                    onSuccess={() => handleSubmit(new Event('submit') as any)}
                    onError={(err) => setError(err)}
                  />
                </Elements>
              </section>
            ) : (
              <div className="p-8 bg-white rounded-[32px] border border-[#141414]/5 text-center">
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="animate-spin mb-4 opacity-20" size={32} />
                  <p className="text-sm opacity-50">Initializing secure payment...</p>
                  {!stripePromise && (
                    <div className="mt-4 p-3 bg-rose-50 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle size={14} />
                      Stripe is not configured correctly.
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <>
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
                disabled={isSubmitting || items.length === 0 || !shippingAddress}
                className="w-full bg-[#141414] text-white py-4 rounded-[20px] font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : (
                  <>
                    Place Order
                    <CheckCircle2 size={24} />
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-[32px] border border-[#141414]/5 shadow-sm sticky top-8">
            <h2 className="text-xl font-bold text-[#141414] mb-6 flex items-center gap-3">
              <ShoppingBag size={20} className="text-[#141414]/40" />
              Order Summary
            </h2>
            
            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => {
                if (!item || !item.product) return null;
                const basePrice = Number(item.product.base_price || 0);
                const salePercentage = Number(item.product.sale_percentage || 0);
                const price = salePercentage > 0
                  ? basePrice * (1 - salePercentage / 100)
                  : basePrice;

                return (
                  <div key={item.product.id} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.product.name}</div>
                      <div className="text-xs text-[#141414]/40 font-mono">
                        {item.quantity} x {currency}{price.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-mono text-sm">
                      {currency}{(price * (item.quantity || 0)).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 pt-6 border-t border-[#141414]/5">
              <div className="flex justify-between text-[#141414]/60 text-sm">
                <span>Subtotal</span>
                <span className="font-mono">{currency}{Number(totalPrice || 0).toFixed(2)}</span>
              </div>
              
              {/* Coupon Section */}
              <div className="py-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={couponCode}
                    onChange={e => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponDiscount(0);
                      setCouponError('');
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#e5e5e5] focus:outline-none focus:ring-1 focus:ring-[#141414]"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode}
                    className="px-4 py-2 bg-[#141414] text-white text-xs font-bold rounded-lg hover:bg-black transition-all disabled:opacity-50"
                  >
                    {isApplyingCoupon ? <Loader2 className="animate-spin" size={14} /> : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-rose-600 mt-1 ml-1">{couponError}</p>}
                {couponDiscount > 0 && (
                  <p className="text-[10px] text-emerald-600 mt-1 ml-1 font-medium flex items-center gap-1">
                    <CheckCircle2 size={10} /> Coupon applied: -{currency}{couponDiscount.toFixed(2)}
                  </p>
                )}
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 text-sm font-medium">
                  <span>Discount</span>
                  <span className="font-mono">-{currency}{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#141414]/60 text-sm">
                <span>Shipping</span>
                <span className="font-mono">FREE</span>
              </div>
              <div className="flex justify-between text-[#141414] text-lg font-bold pt-2">
                <span>Total</span>
                <span className="font-mono text-xl">{currency}{(totalPrice - couponDiscount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
