import React from 'react';
import { useBranding } from '../context/BrandingContext';
import { Mail, MapPin, Phone, Instagram, Twitter, Facebook, Linkedin, ArrowRight, ExternalLink } from 'lucide-react';

export const Footer = () => {
  const { config } = useBranding();

  if (!config) return null;

  const footerStyle = config.footer_use_brand_color 
    ? { backgroundColor: config.primary_color || 'var(--secondary-color)', color: '#ffffff' }
    : { backgroundColor: '#ffffff', color: 'var(--secondary-color)' };

  const opacityClass = config.footer_use_brand_color ? 'text-white/70' : 'text-[#141414]/50';
  const headingClass = config.footer_use_brand_color ? 'text-white' : 'text-[#141414]';
  const borderClass = config.footer_use_brand_color ? 'border-white/10' : 'border-[#141414]/5';

  return (
    <footer style={footerStyle} className="mt-20 border-t border-[#141414]/5 relative overflow-hidden">
      {/* Decorative background element */}
      {config.footer_use_brand_color && (
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 transform translate-x-1/2 pointer-events-none" />
      )}

      <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand & Mission */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {config.logo_url ? (
                <img src={config.logo_url} alt={config.company_name} className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className={`text-xl font-bold tracking-tighter ${headingClass}`}>{config.company_name}</span>
              )}
            </div>
            <p className={`text-xs leading-relaxed max-w-sm ${opacityClass}`}>
              {config.footer_tagline || config.hero_subtitle || 'Redefining excellence through innovation and premium quality solutions for our global clientele.'}
            </p>
            {config.social_links_enabled !== false && (
              <div className="flex gap-3">
                <SocialIcon icon={Instagram} />
                <SocialIcon icon={Linkedin} />
                <SocialIcon icon={Twitter} />
                <SocialIcon icon={Facebook} />
              </div>
            )}
          </div>

          {/* Useful Links */}
          <div className="space-y-6">
            <h4 className={`text-[10px] font-bold uppercase tracking-widest ${headingClass}`}>Navigation</h4>
            <nav className="flex flex-col gap-3">
              <FooterLink href="/" label="Home" opacityClass={opacityClass} />
              <FooterLink href="/products" label="Products" opacityClass={opacityClass} />
              <FooterLink href="/faq" label="FAQ" opacityClass={opacityClass} />
              {config.contact_page_enabled && (
                <FooterLink href="/contact" label="Support Center" opacityClass={opacityClass} />
              )}
              {config.catalogue_url && (
                <FooterLink href={config.catalogue_url} label="Catalogue" opacityClass={opacityClass} external />
              )}
            </nav>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h4 className={`text-[10px] font-bold uppercase tracking-widest ${headingClass}`}>Contact</h4>
            <div className="flex flex-col gap-4">
              {config.footer_email && (
                <div className="flex items-center gap-3">
                  <Mail size={14} className={opacityClass} />
                  <a href={`mailto:${config.footer_email}`} className={`text-xs hover:underline decoration-1 ${headingClass}`}>{config.footer_email}</a>
                </div>
              )}
              {config.footer_phone && (
                <div className="flex items-center gap-3">
                  <Phone size={14} className={opacityClass} />
                  <a href={`tel:${config.footer_phone}`} className={`text-xs ${headingClass}`}>{config.footer_phone}</a>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin size={14} className={opacityClass} />
                <span className={`text-xs leading-relaxed whitespace-pre-line ${headingClass}`}>
                  {config.footer_address || 'Global HQ\nTechnology District, North America'}
                </span>
              </div>
            </div>
          </div>

          {/* Newsletter / Action */}
          <div className="space-y-6">
            <h4 className={`text-[10px] font-bold uppercase tracking-widest ${headingClass}`}>Newsletter</h4>
            <p className={`text-xs ${opacityClass}`}>Subscribe for the latest updates and exclusive offers.</p>
            <div className="relative">
              <input 
                type="email" 
                placeholder="email@example.com"
                className={`w-full bg-black/5 border ${borderClass} rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] transition-all`}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--primary-color)] text-white rounded-lg hover:brightness-110 transition-all">
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-16 pt-8 border-t ${borderClass} flex flex-col md:flex-row justify-between items-center gap-6`}>
          <p className={`text-[10px] font-mono uppercase tracking-widest ${opacityClass}`}>
            {config.footer_copyright || `© ${new Date().getFullYear()} ${config.company_name}. Built for the future of commerce.`}
          </p>
          <div className={`flex gap-8 text-[10px] font-mono uppercase tracking-widest underline decoration-[#141414]/10 underline-offset-4 ${opacityClass}`}>
            <a href="#" className="hover:text-[var(--primary-color)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--primary-color)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--primary-color)] transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ href, label, opacityClass, external }: { href: string; label: string; opacityClass: string; external?: boolean }) => (
  <a 
    href={href} 
    target={external ? "_blank" : "_self"}
    className={`text-xs flex items-center gap-1 hover:text-[var(--primary-color)] transition-all ${opacityClass}`}
  >
    {label}
    {external && <ExternalLink size={10} />}
  </a>
);

const SocialIcon = ({ icon: Icon }: { icon: any }) => (
  <a href="#" className="w-9 h-9 rounded-xl bg-[#141414]/5 flex items-center justify-center hover:bg-[var(--primary-color)] hover:text-white transition-all group">
    <Icon size={16} className="opacity-60 group-hover:opacity-100" />
  </a>
);
