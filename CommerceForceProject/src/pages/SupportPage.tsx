import React, { useState } from 'react';
import { useBranding } from '../context/BrandingContext';
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const SupportPage = () => {
  const { config } = useBranding();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border border-black/5 p-12 rounded-[40px] text-center shadow-sm"
        >
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Ticket Submitted</h2>
          <p className="text-black/60 mb-8">Your support request has been received. Our support team will review your inquiry and respond within 24 hours.</p>
          <button 
            onClick={() => setSubmitted(false)}
            className="w-full py-4 bg-[var(--primary-color)] text-white rounded-2xl font-bold hover:opacity-90 transition-all"
          >
            Submit Another Request
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-12">
          <div className="space-y-6">
            <h1 className="text-6xl font-bold tracking-tight">Support Center</h1>
            <p className="text-xl text-black/60 leading-relaxed">
              Need assistance? Our dedicated support team is here to help you with product inquiries, 
              technical issues, or order management.
            </p>
          </div>

          <div className="space-y-8">
            <div className="p-8 bg-black/5 rounded-[32px] border border-black/5">
              <h3 className="text-lg font-bold mb-4">Support Channels</h3>
              <div className="space-y-6">
                {config?.footer_email && (
                  <div className="flex items-center gap-4">
                    <Mail size={20} className="text-black/40" />
                    <div>
                      <p className="text-xs opacity-40 uppercase tracking-widest font-bold">Priority Support</p>
                      <p className="font-bold">{config.footer_email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Phone size={20} className="text-black/40" />
                  <div>
                    <p className="text-xs opacity-40 uppercase tracking-widest font-bold">Technical Assistance</p>
                    <p className="font-bold">{config?.footer_phone || '+1 (555) 000-0000'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/5 p-10 rounded-[40px] shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Submit a Support Ticket</h2>
            <p className="text-sm opacity-60">Fill out the form below and we'll get back to you shortly.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 ml-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-black/5 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 ml-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  className="w-full bg-black/5 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 ml-1">Issue Category</label>
              <select 
                required
                className="w-full bg-black/5 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all appearance-none"
              >
                <option value="product">Product Inquiry</option>
                <option value="order">Order Status</option>
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing & Payments</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 ml-1">Message</label>
              <textarea 
                required
                className="w-full bg-black/5 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all min-h-[150px]"
                placeholder="Describe your issue in detail..."
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-[var(--primary-color)] text-white rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[var(--primary-color)]/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
