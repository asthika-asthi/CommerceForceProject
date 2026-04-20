import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  amount: number;
  items: any[];
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ onSuccess, onError, amount, items }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { config: brandingConfig } = useBranding();
  const currency = brandingConfig?.currency_symbol || '£';
  const [isProcessing, setIsProcessing] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      // Last second stock validation
      const validateRes = await fetch('/api/products/validate-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: items.map((i: any) => ({ productId: i.product.id, quantity: i.quantity })) 
        })
      });

      if (!validateRes.ok) {
        const data = await validateRes.json();
        throw new Error(data.error || 'Items are no longer available in these quantities.');
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/checkout?success=true',
        },
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message || 'An unexpected error occurred.');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        try {
          await onSuccess();
        } catch (err: any) {
          throw new Error('Payment was successful, but we encountered an error creating your order. Please do NOT try again and contact our support team immediately with your payment details.');
        }
      }
    } catch (err: any) {
      onError(err.message || 'An error occurred during payment processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-[#141414] text-white py-4 rounded-[20px] font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="animate-spin" size={24} /> : `Pay ${currency}${amount.toFixed(2)}`}
      </button>
    </form>
  );
};
