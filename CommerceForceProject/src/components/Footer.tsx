import React from 'react';
import { useBranding } from '../context/BrandingContext';
import { Mail, MapPin, Phone, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';

export const Footer = () => {
  const { config } = useBranding();

  if (!config) return null;

  const footerStyle = config.footer_use_brand_color 
    ? { backgroundColor: config.primary_color || 'var(--secondary-color)', color: '#ffffff' }
    : { backgroundColor: '#ffffff', color: 'var(--secondary-color)' };

  const opacityClass = config.footer_use_brand_color ? 'opacity-70' : 'opacity-40';
  const borderClass = config.footer_use_brand_color ? 'border-white/10' : 'border-black/5';

  return (
    <footer style={footerStyle} className="mt-20 border-t border-black/5">
      <div className="max-w-[1600px] mx-auto px-10 py-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-20">
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-3">
              {config.logo_url ? (
                <img src={config.logo_url} alt={config.company_name} className="h-6 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-lg font-bold tracking-tighter" style={{ color: config.footer_use_brand_color ? '#ffffff' : 'var(--secondary-color)' }}>{config.company_name}</span>
              )}
            </div>
            <p className={`text-xs leading-relaxed ${opacityClass}`}>
              {config.footer_tagline || config.hero_subtitle || 'Providing premium solutions and high-quality products to our valued clients worldwide.'}
            </p>
            {config.social_links_enabled !== false && (
              <div className="flex gap-3">
                <SocialIcon icon={Instagram} />
                <SocialIcon icon={Twitter} />
                <SocialIcon icon={Facebook} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-x-16 gap-y-8 flex-1 justify-end">
            <div className="space-y-4 min-w-[120px]">
              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Navigate</h4>
              <ul className={`space-y-2 text-xs font-bold ${opacityClass}`}>
                <li><a href="/" className="hover:opacity-100 transition-opacity">Home</a></li>
                <li><a href="/products" className="hover:opacity-100 transition-opacity">Products</a></li>
                {config.contact_page_enabled && (
                  <li><a href="/contact" className="hover:opacity-100 transition-opacity">Support</a></li>
                )}
                <li><a href="/contact-us" className="hover:opacity-100 transition-opacity">Contact</a></li>
              </ul>
            </div>

            <div className="space-y-4 max-w-xs">
              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Contact Info</h4>
              <div className={`space-y-2 text-xs font-bold ${opacityClass}`}>
                {config.footer_email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    <span>{config.footer_email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{config.footer_phone || '+1 (555) 000-0000'}</span>
                </div>
                {config.footer_address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span className="whitespace-pre-line">{config.footer_address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-10 pt-6 border-t ${borderClass} flex flex-col md:flex-row justify-between items-center gap-4`}>
          <p className={`text-[9px] font-mono uppercase tracking-widest ${opacityClass}`}>
            {config.footer_copyright || `© ${new Date().getFullYear()} ${config.company_name}. All rights reserved.`}
          </p>
          <div className={`flex gap-6 text-[9px] font-mono uppercase tracking-widest ${opacityClass}`}>
            <a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon: Icon }: { icon: any }) => (
  <a href="#" className="w-10 h-10 rounded-xl bg-[var(--secondary-color-light)] flex items-center justify-center hover:bg-[var(--primary-color)] hover:text-white transition-all group">
    <Icon size={18} className="opacity-60 group-hover:opacity-100" style={{ color: 'var(--secondary-color)' }} />
  </a>
);
