import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, ArrowLeft, CreditCard, Truck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FeatureFlag } from '../shared/types';

export const Checkout = ({ onBack }: { onBack: () => void }) => {
  const { items, totalPrice, clearCart } = useCart();
  const { token, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [error, setError] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'credit' | 'credit_card' | 'paypal' | 'razorpay'>('prepaid');
  const [features, setFeatures] = useState<FeatureFlag[]>([]);

  const b2bEnabled = Boolean(features.find(f => f.feature_key === 'b2b_enabled')?.enabled ?? true);

  useEffect(() => {
    if (token) {
      fetch('/api/admin/features', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setFeatures)
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
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          shippingAddress,
          paymentMethod
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
              <button
                type="button"
                onClick={() => setPaymentMethod('prepaid')}
                className={`p-6 rounded-[24px] border-2 text-left transition-all ${
                  paymentMethod === 'prepaid' 
                    ? 'border-[#141414] bg-[#141414]/5' 
                    : 'border-[#141414]/5 bg-white hover:border-[#141414]/20'
                }`}
              >
                <div className="font-bold mb-1">Direct Payment</div>
                <div className="text-xs text-[#141414]/60">Pay now using card or bank transfer</div>
              </button>

              {b2bEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`p-6 rounded-[24px] border-2 text-left transition-all ${
                    paymentMethod === 'credit' 
                      ? 'border-[#141414] bg-[#141414]/5' 
                      : 'border-[#141414]/5 bg-white hover:border-[#141414]/20'
                  }`}
                >
                  <div className="font-bold mb-1">Credit Limit</div>
                  <div className="text-xs text-[#141414]/60">
                    Charge to your account credit (£{user?.available_credit?.toFixed(2) || '0.00'} available)
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-6 rounded-[24px] border-2 text-left transition-all ${
                  paymentMethod === 'credit_card' 
                    ? 'border-[#141414] bg-[#141414]/5' 
                    : 'border-[#141414]/5 bg-white hover:border-[#141414]/20'
                }`}
              >
                <div className="font-bold mb-1">Credit Card</div>
                <div className="text-xs text-[#141414]/60">Visa, Mastercard, AMEX</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`p-6 rounded-[24px] border-2 text-left transition-all ${
                  paymentMethod === 'paypal' 
                    ? 'border-[#141414] bg-[#141414]/5' 
                    : 'border-[#141414]/5 bg-white hover:border-[#141414]/20'
                }`}
              >
                <div className="font-bold mb-1">PayPal</div>
                <div className="text-xs text-[#141414]/60">Pay via your PayPal account</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-6 rounded-[24px] border-2 text-left transition-all ${
                  paymentMethod === 'razorpay' 
                    ? 'border-[#141414] bg-[#141414]/5' 
                    : 'border-[#141414]/5 bg-white hover:border-[#141414]/20'
                }`}
              >
                <div className="font-bold mb-1">Razorpay</div>
                <div className="text-xs text-[#141414]/60">Secure payment via Razorpay</div>
              </button>
            </div>
          </section>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
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
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-[32px] border border-[#141414]/5 shadow-sm sticky top-8">
            <h2 className="text-xl font-bold text-[#141414] mb-6 flex items-center gap-3">
              <ShoppingBag size={20} className="text-[#141414]/40" />
              Order Summary
            </h2>
            
            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.product.name}</div>
                    <div className="text-xs text-[#141414]/40 font-mono">
                      {item.quantity} x £{item.product.base_price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-mono text-sm">
                    £{(item.product.base_price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-[#141414]/5">
              <div className="flex justify-between text-[#141414]/60 text-sm">
                <span>Subtotal</span>
                <span className="font-mono">£{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#141414]/60 text-sm">
                <span>Shipping</span>
                <span className="font-mono">FREE</span>
              </div>
              <div className="flex justify-between text-[#141414] text-lg font-bold pt-2">
                <span>Total</span>
                <span className="font-mono text-xl">£{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
