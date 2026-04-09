import React from 'react';
import { useBranding } from '../context/BrandingContext';
import { Mail, MapPin, Phone, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';

export const Footer = () => {
  const { config } = useBranding();

  if (!config) return null;

  const footerStyle = config.footer_use_brand_color 
    ? { backgroundColor: config.primary_color || '#141414', color: '#ffffff' }
    : { backgroundColor: '#ffffff', color: '#141414' };

  const opacityClass = config.footer_use_brand_color ? 'opacity-70' : 'opacity-40';
  const borderClass = config.footer_use_brand_color ? 'border-white/10' : 'border-black/5';

  return (
    <footer style={footerStyle} className="mt-20 border-t border-black/5">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {config.logo_url ? (
                <img src={config.logo_url} alt={config.company_name} className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xl font-bold tracking-tighter">{config.company_name}</span>
              )}
            </div>
            <p className={`text-sm leading-relaxed ${opacityClass}`}>
              Providing premium solutions and high-quality products to our valued clients worldwide.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={Instagram} />
              <SocialIcon icon={Twitter} />
              <SocialIcon icon={Facebook} />
              <SocialIcon icon={Linkedin} />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest">Quick Links</h4>
            <ul className={`space-y-4 text-sm ${opacityClass}`}>
              <li><a href="/" className="hover:opacity-100 transition-opacity">Home</a></li>
              <li><a href="/products" className="hover:opacity-100 transition-opacity">Products</a></li>
              {config.contact_page_enabled && (
                <li><a href="/contact" className="hover:opacity-100 transition-opacity">Contact Us</a></li>
              )}
              <li><a href="/about" className="hover:opacity-100 transition-opacity">About Us</a></li>
            </ul>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {config.footer_email && (
                  <div className="flex items-center gap-3">
                    <Mail size={18} className={opacityClass} />
                    <span className="text-sm font-medium">{config.footer_email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Phone size={18} className={opacityClass} />
                  <span className="text-sm font-medium">+1 (555) 000-0000</span>
                </div>
              </div>
              {config.footer_address && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className={`mt-1 ${opacityClass}`} />
                  <span className="text-sm font-medium leading-relaxed whitespace-pre-line">
                    {config.footer_address}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`mt-20 pt-8 border-t ${borderClass} flex flex-col md:flex-row justify-between items-center gap-4`}>
          <p className={`text-[10px] font-mono uppercase tracking-widest ${opacityClass}`}>
            {config.footer_copyright || `© ${new Date().getFullYear()} ${config.company_name}. All rights reserved.`}
          </p>
          <div className={`flex gap-8 text-[10px] font-mono uppercase tracking-widest ${opacityClass}`}>
            <a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon: Icon }: { icon: any }) => (
  <a href="#" className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-[var(--primary-color)] hover:text-white transition-all group">
    <Icon size={18} className="opacity-60 group-hover:opacity-100" />
  </a>
);
