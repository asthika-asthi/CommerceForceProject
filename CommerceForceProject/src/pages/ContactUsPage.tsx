import React from 'react';
import { useBranding } from '../context/BrandingContext';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

export const ContactUsPage = () => {
  const { config } = useBranding();

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="space-y-16">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-6xl font-bold tracking-tight">Contact Us</h1>
          <p className="text-xl text-black/60 leading-relaxed">
            Have a general question about our company, products, or services? 
            Our team is available to assist you with any inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {config?.footer_email && (
            <div className="p-10 bg-white border border-black/5 rounded-[40px] shadow-sm space-y-6 group hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Mail size={28} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-1">Email inquiries</p>
                <p className="text-xl font-bold">{config.footer_email}</p>
              </div>
            </div>
          )}

          <div className="p-10 bg-white border border-black/5 rounded-[40px] shadow-sm space-y-6 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Phone size={28} />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-1">Call our office</p>
              <p className="text-xl font-bold">{config?.footer_phone || '+1 (555) 000-0000'}</p>
            </div>
          </div>

          {config?.footer_address && (
            <div className="p-10 bg-white border border-black/5 rounded-[40px] shadow-sm space-y-6 group hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MapPin size={28} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-1">Visit our headquarters</p>
                <p className="text-xl font-bold whitespace-pre-line">{config.footer_address}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-12 bg-black/5 rounded-[48px] border border-black/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Need Technical Support?</h2>
            <p className="text-black/60">If you have an issue with an existing order or need technical help, please visit our Support Center.</p>
          </div>
          <button 
            onClick={() => {
              window.history.pushState({}, '', '/contact');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="px-8 py-4 bg-[var(--primary-color)] text-white rounded-2xl font-bold hover:opacity-90 transition-all flex items-center gap-2 whitespace-nowrap shadow-xl shadow-[var(--primary-color)]/20"
          >
            <MessageSquare size={20} />
            Go to Support Center
          </button>
        </div>
      </div>
    </div>
  );
};
