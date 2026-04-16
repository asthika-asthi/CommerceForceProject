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
    <footer style={footerStyle} className="mt-12 border-t border-black/5">
      <div className="max-w-[1600px] mx-auto px-10 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Column 1: Brand & Tagline */}
          <div className="flex flex-col md:flex-row items-center gap-6 max-w-2xl">
            <div className="flex items-center gap-3 shrink-0">
              {config.logo_url ? (
                <img src={config.logo_url} alt={config.company_name} className="h-6 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-sm font-bold tracking-tighter" style={{ color: config.footer_use_brand_color ? '#ffffff' : 'var(--secondary-color)' }}>{config.company_name}</span>
              )}
            </div>
            <p className={`text-[10px] leading-tight text-center md:text-left ${opacityClass} max-w-sm`}>
              {config.footer_tagline || config.hero_subtitle || 'Providing premium solutions and high-quality products to our valued clients worldwide.'}
            </p>
            {config.social_links_enabled !== false && (
              <div className="flex gap-2">
                <SocialIcon icon={Instagram} />
                <SocialIcon icon={Twitter} />
                <SocialIcon icon={Facebook} />
              </div>
            )}
          </div>

          {/* Column 2: Compact Links */}
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
              <a href="/" className={`hover:opacity-100 transition-opacity ${opacityClass}`}>Home</a>
              <a href="/products" className={`hover:opacity-100 transition-opacity ${opacityClass}`}>Products</a>
              {config.contact_page_enabled && (
                <a href="/contact" className={`hover:opacity-100 transition-opacity ${opacityClass}`}>Support</a>
              )}
              <a href="/contact-us" className={`hover:opacity-100 transition-opacity ${opacityClass}`}>Contact</a>
            </nav>
            
            <div className={`hidden lg:flex flex-col items-end gap-1 text-[9px] font-mono uppercase tracking-tighter ${opacityClass}`}>
              {config.footer_email && <span>{config.footer_email}</span>}
              {config.footer_phone && <span>{config.footer_phone}</span>}
            </div>
          </div>
        </div>

        <div className={`mt-6 pt-4 border-t ${borderClass} flex flex-col md:flex-row justify-between items-center gap-4`}>
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
  <a href="#" className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center hover:bg-[var(--primary-color)] hover:text-white transition-all group">
    <Icon size={14} className="opacity-60 group-hover:opacity-100" />
  </a>
);
