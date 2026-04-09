import React, { useState } from 'react';
import { useBranding } from '../context/BrandingContext';
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const ContactUsPage = () => {
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
          <h2 className="text-3xl font-bold mb-4">Message Sent!</h2>
          <p className="text-black/60 mb-8">Thank you for reaching out. Our team will get back to you as soon as possible.</p>
          <button 
            onClick={() => setSubmitted(false)}
            className="w-full py-4 bg-[var(--primary-color)] text-white rounded-2xl font-bold hover:opacity-90 transition-all"
          >
            Send Another Message
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
            <h1 className="text-6xl font-bold tracking-tight">Get in touch</h1>
            <p className="text-xl text-black/60 leading-relaxed">
              Have a question about our products, bulk orders, or partnership opportunities? 
              We're here to help.
            </p>
          </div>

          <div className="space-y-8">
            {config?.footer_email && (
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-1">Email us</p>
                  <p className="text-xl font-bold">{config.footer_email}</p>
                </div>
              </div>
            )}

            {config?.footer_address && (
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-1">Visit us</p>
                  <p className="text-xl font-bold whitespace-pre-line">{config.footer_address}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-6">
              <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-1">Call us</p>
                <p className="text-xl font-bold">+1 (555) 000-0000</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/5 p-10 rounded-[40px] shadow-sm">
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
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 ml-1">Subject</label>
              <input 
                required
                type="text" 
                className="w-full bg-black/5 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all"
                placeholder="How can we help?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 ml-1">Message</label>
              <textarea 
                required
                className="w-full bg-black/5 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all min-h-[150px]"
                placeholder="Tell us more about your inquiry..."
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-[var(--primary-color)] text-white rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[var(--primary-color)]/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
