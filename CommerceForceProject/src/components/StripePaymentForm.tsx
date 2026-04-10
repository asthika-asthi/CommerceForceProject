import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  amount: number;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ onSuccess, onError, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/checkout?success=true',
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-[#141414] text-white py-4 rounded-[20px] font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="animate-spin" size={24} /> : `Pay £${amount.toFixed(2)}`}
      </button>
    </form>
  );
};
