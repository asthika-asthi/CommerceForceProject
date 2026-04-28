import React, { useEffect, useState, useCallback } from 'react';
import { Product, LayoutSection } from '../shared/types';
import { useBranding } from '../context/BrandingContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight, Star, Shield, Truck, Plus, ChevronLeft, ChevronRight, HelpCircle, MessageSquare, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { Carousel } from '../components/Carousel';
import { useResponsiveStyle } from '../hooks/useResponsiveStyle';

const ensureAbsoluteUrl = (url: string | undefined) => {
  if (!url) return url;
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  return `/${url}`;
};

export const LandingPage = ({ onShopNow }: { onShopNow: () => void }) => {
  const { config: brandingConfig, isLoading: brandingLoading } = useBranding();
  const { user, setPendingAction } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [layout, setLayout] = useState<LayoutSection[]>([]);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const requireAuth = useCallback((product: Product) => {
    if (!user) {
      setPendingAction({
        type: 'BUY_NOW',
        data: { product },
        redirectTo: '/'
      });
      navigate('/login');
      return false;
    }
    return true;
  }, [user, setPendingAction, navigate]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setFeaturedProducts(data.filter((p: Product) => p.is_featured).slice(0, 8));
      });
  }, []);

  useEffect(() => {
    if (brandingConfig?.layout_config) {
      try {
        setLayout(JSON.parse(brandingConfig.layout_config));
      } catch (e) {
        setLayout([]);
      }
    }
  }, [brandingConfig]);

  const heroSection = layout.find(s => s.type === 'hero' && s.enabled);
  const heroConfig = {
    title: heroSection?.config.title || brandingConfig?.hero_title || 'Welcome to CommerceForce',
    subtitle: heroSection?.config.subtitle || heroSection?.config.desc || brandingConfig?.hero_subtitle || 'Discover premium products curated just for you.',
    image: ensureAbsoluteUrl(heroSection?.config.image || heroSection?.config.imageUrl || brandingConfig?.hero_image_url),
    cta_text: heroSection?.config.buttonText || brandingConfig?.hero_cta_text || 'Shop Now',
    cta_link: heroSection?.config.link || brandingConfig?.hero_cta_link || '/products',
    backgroundColor: heroSection?.config.backgroundColor || brandingConfig?.background_value
  };

  const buttonClass = `flex items-center gap-2 px-8 py-4 bg-white text-black font-bold hover:bg-[var(--primary-color)] hover:text-white transition-all shadow-xl ${
    brandingConfig?.button_style === 'pill' ? 'rounded-full' : 
    brandingConfig?.button_style === 'square' ? 'rounded-none' : 'rounded-2xl'
  }`;

  if (brandingLoading || !brandingConfig) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-color)]" />
      </div>
    );
  }

  const showCarousel = brandingConfig?.carousel_enabled;
  const showHero = !showCarousel && brandingConfig?.hero_enabled !== false;

  return (
    <div className="space-y-6 pb-24">
      {/* Top Section: Carousel OR Hero */}
      {showCarousel && (
        <Carousel 
          images={(() => {
            const val = brandingConfig.carousel_images;
            if (Array.isArray(val)) return val;
            if (!val) return [];
            
            try {
              if (typeof val === 'string' && (val.trim().startsWith('[') || val.trim().startsWith('{'))) {
                return JSON.parse(val);
              }
              return String(val).split(',').map(url => url.trim()).filter(Boolean);
            } catch (e) {
              console.error('Failed to parse carousel_images:', e);
              return String(val).split(',').map(url => url.trim()).filter(Boolean);
            }
          })()} 
          onNavigate={navigate}
        />
      )}

      {showHero && (
        <section className="relative h-[600px] rounded-[40px] overflow-hidden group">
          {heroConfig.image ? (
            heroConfig.image.endsWith('.mp4') ? (
              <video autoPlay muted loop className="absolute inset-0 w-full h-full object-cover">
                <source src={heroConfig.image} type="video/mp4" />
              </video>
            ) : (
              <img 
                src={heroConfig.image} 
                alt="Hero" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            )
          ) : (
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[var(--primary-color)] to-black" 
              style={heroConfig.backgroundColor ? { backgroundImage: `linear-gradient(to bottom right, ${heroConfig.backgroundColor}, black)` } : {}}
            />
          )}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight hero-title"
            >
              {heroConfig.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed"
            >
              {heroConfig.subtitle}
            </motion.p>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => heroConfig.cta_link ? navigate(heroConfig.cta_link) : onShopNow()}
              className={buttonClass}
            >
              {heroConfig.cta_text}
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </motion.button>
          </div>
        </section>
      )}

      {/* Dynamic Sections */}
      {layout?.filter((s: any) => s.type !== 'hero' && s.enabled).map((section) => (
        <DynamicSection 
          key={section.id} 
          section={section} 
          featuredProducts={featuredProducts}
          addToCart={addToCart}
          requireAuth={requireAuth}
          navigate={navigate}
          onShopNow={onShopNow}
          brandingConfig={brandingConfig}
        />
      ))}

      {/* Default Features if no layout */}
      {(!layout || layout.length === 0) && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Truck, title: 'Fast Delivery', desc: 'Global shipping with real-time tracking for all orders.' },
            { icon: Shield, title: 'Secure Payments', desc: 'Enterprise-grade security for all your transactions.' },
            { icon: Star, title: 'Premium Quality', desc: 'Only the finest products sourced from trusted manufacturers.' }
          ].map((feature, i) => (
            <div key={i} className="p-10 bg-white rounded-[32px] border border-black/5 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-[var(--primary-color-light)] text-[var(--primary-color)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-sm text-black/50 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

const StyledSectionWrap = ({ section, children }: { section: LayoutSection, children: React.ReactNode }) => {
  const containerStyles = useResponsiveStyle(section.styles?.container);
  return (
    <section 
      key={section.id} 
      style={containerStyles}
      className={`w-full overflow-hidden ${!section.styles?.container ? 'py-8' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
};

const DynamicSection = ({ 
  section, 
  featuredProducts, 
  addToCart, 
  requireAuth, 
  navigate, 
  onShopNow, 
  brandingConfig 
}: { 
  section: LayoutSection, 
  featuredProducts: Product[], 
  addToCart: (p: Product, q?: number) => void,
  requireAuth: (p: Product) => boolean,
  navigate: (path: string) => void,
  onShopNow: () => void,
  brandingConfig: any,
  key?: string | number
}) => {
  const titleStyles = useResponsiveStyle(section.styles?.title);
  const subtitleStyles = useResponsiveStyle(section.styles?.subtitle);
  const buttonStyles = useResponsiveStyle(section.styles?.button);
  const cardStyles = useResponsiveStyle(section.styles?.card);
  const gridStyles = section.styles?.grid;

  const desktopCols = gridStyles?.desktop?.columns || section.config.columns || (section.type === 'category_grid' ? 4 : 3);
  const mobileCols = gridStyles?.mobile?.columns || 1;
  const tabletCols = gridStyles?.tablet?.columns || 2;
  const gap = gridStyles?.desktop?.gap || section.config.gap || '2rem';
  
  const responsiveGridClass = `grid grid-cols-${mobileCols} sm:grid-cols-${tabletCols} lg:grid-cols-${desktopCols}`;

  const getConfig = (keys: string[]) => {
    for (const key of keys) {
      if (section.config[key] !== undefined) return section.config[key];
    }
    return undefined;
  };

  const title = getConfig(['title']);
  const body = getConfig(['body', 'text', 'desc', 'subtitle']);
  const imageUrl = getConfig(['imageUrl', 'image']);
  const buttonText = getConfig(['buttonText', 'button_text', 'cta_text']);
  const link = getConfig(['link', 'button_link', 'cta_link']);

  switch (section.type) {
    case 'features':
      return (
        <StyledSectionWrap section={section}>
           <div className="space-y-12">
            {title && (
              <h2 style={titleStyles} className="text-3xl font-bold text-center">{title}</h2>
            )}
            <div 
              className={responsiveGridClass}
              style={{ gap: gap }}
            >
              {(section.config.items || []).map((feature: any, i: number) => (
                <div key={i} style={cardStyles} className="p-10 bg-white rounded-[32px] border border-black/5 shadow-sm hover:shadow-xl transition-all group">
                  <div className="w-14 h-14 bg-[var(--primary-color-light)] text-[var(--primary-color)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Star size={28} />
                  </div>
                  <h3 style={titleStyles} className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p style={subtitleStyles} className="text-sm text-black/50 leading-relaxed">{feature.desc || feature.text || feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </StyledSectionWrap>
      );

    case 'promotions':
      return (
        <StyledSectionWrap section={section}>
          <div 
            style={cardStyles} 
            className={`relative overflow-hidden rounded-[40px] p-12 flex flex-col md:flex-row items-center gap-10 ${!cardStyles.backgroundColor && section.config.variant === 'dark' ? 'bg-[var(--secondary-color)] text-white' : 'bg-white border border-black/5 shadow-sm'}`}
          >
            {imageUrl && (
              <div className="w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden">
                <img 
                  src={section.config.imageUrl ? ensureAbsoluteUrl(section.config.imageUrl) : ensureAbsoluteUrl(section.config.image)} 
                  alt="Promo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="flex-1 space-y-6 text-center md:text-left">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">{section.config.tag || 'Special Offer'}</span>
              <h2 style={titleStyles} className="text-4xl font-bold leading-tight">{title}</h2>
              <p style={subtitleStyles} className="text-lg opacity-60">{body}</p>
              {buttonText && (
                <button 
                  onClick={() => navigate(link || '#')}
                  style={buttonStyles}
                  className={`px-8 py-4 font-bold transition-all ${
                    brandingConfig?.button_style === 'pill' ? 'rounded-full' : 
                    brandingConfig?.button_style === 'square' ? 'rounded-none' : 'rounded-2xl'
                  } ${!buttonStyles.backgroundColor && section.config.variant === 'dark' ? 'bg-white text-black hover:bg-[var(--primary-color)] hover:text-white' : 'bg-[var(--primary-color)] text-white hover:opacity-90'}`}
                >
                  {buttonText}
                </button>
              )}
            </div>
          </div>
        </StyledSectionWrap>
      );

    case 'products':
      return (
        <StyledSectionWrap section={section}>
           <div className="space-y-12">
            <div className="flex items-end justify-between px-4">
              <div className="space-y-2">
                <h2 style={titleStyles} className="text-3xl font-bold tracking-tight">{title || 'Featured Products'}</h2>
                {section.config.subtitle && (
                  <p style={subtitleStyles} className="text-black/40 font-medium">{section.config.subtitle}</p>
                )}
              </div>
              <button onClick={onShopNow} className="text-sm font-bold text-[var(--primary-color)] hover:underline flex items-center gap-2">
                View All <ArrowRight size={16} />
              </button>
            </div>
            <div 
              className={responsiveGridClass}
              style={{ gap: gap }}
            >
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={() => {
                    if (requireAuth(product)) {
                      addToCart(product, 1);
                    }
                  }} 
                />
              ))}
            </div>
          </div>
        </StyledSectionWrap>
      );

    case 'category_grid' as any:
      return (
        <StyledSectionWrap section={section}>
          <div className="space-y-8">
            {title && (
              <div className="px-4">
                <h2 style={titleStyles} className="text-3xl font-bold tracking-tight">{title}</h2>
              </div>
            )}
            <div 
              className={responsiveGridClass}
              style={{ gap: gap }}
            >
              {(section.config.items || []).map((item: any, i: number) => (
                <div 
                  key={i} 
                  onClick={() => item.link && navigate(item.link)}
                  style={cardStyles}
                  className="group relative aspect-square rounded-[32px] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all"
                >
                  <img 
                    src={ensureAbsoluteUrl(item.image || item.imageUrl)} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                    <h3 style={titleStyles} className="text-xl font-bold text-white mb-2">{decodeURIComponent(item.title)}</h3>
                    <div className="flex items-center gap-2 text-white/70 text-sm font-bold group-hover:text-white transition-colors">
                      Shop Now <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StyledSectionWrap>
      );

    case 'content':
      const items = section.config.items || [{ title: title, body: body, imageUrl: imageUrl, alignment: section.config.layout === 'right-image' ? 'right' : section.config.layout === 'left-image' ? 'left' : 'center' }];
      const isGrid = section.config.layoutType === 'grid';
      const gridItems = items.filter((item: any) => item.includeInGrid);

      return (
        <StyledSectionWrap section={section}>
           <div className="space-y-12">
            {section.config.title && (
               <h2 style={titleStyles} className="text-4xl font-bold text-center mb-4">{section.config.title}</h2>
            )}
            
            <div className="space-y-12">
              {items.map((item: any, i: number) => {
                const hasImage = !!item.imageUrl;
                const hasText = !!(item.title || item.body);
                const alignment = item.alignment || 'center';
                
                if (isGrid && item.includeInGrid) {
                   const firstGridIndex = items.findIndex((it: any) => it.includeInGrid);
                   if (i !== firstGridIndex) return null;

                   return (
                     <div key={`grid-${i}`} className={responsiveGridClass} style={{ gap }}>
                       {gridItems.map((gItem: any, gi: number) => (
                         <div 
                           key={gi} 
                           onClick={() => gItem.link && navigate(gItem.link)}
                           style={cardStyles}
                           className={`flex flex-col gap-6 p-8 bg-white rounded-[40px] border border-black/5 shadow-sm hover:shadow-xl transition-all h-full ${
                             gItem.link ? 'cursor-pointer hover:scale-[1.02] duration-300' : ''
                           } ${
                             gItem.alignment === 'left' ? 'text-left items-start' :
                             gItem.alignment === 'right' ? 'text-right items-end' : 'text-center items-center'
                           }`}
                         >
                           {gItem.imageUrl && (
                             <div className="w-full aspect-video rounded-3xl overflow-hidden mb-2 shrink-0">
                               <img src={gItem.imageUrl} alt={gItem.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                             </div>
                           )}
                           <div className={`space-y-3 flex-1 w-full ${
                             gItem.alignment === 'left' ? 'text-left' :
                             gItem.alignment === 'right' ? 'text-right' : 'text-center'
                           }`}>
                             {gItem.title && <h3 style={titleStyles} className="text-2xl font-bold">{gItem.title}</h3>}
                             {gItem.body && <p style={subtitleStyles} className="text-black/60 leading-relaxed whitespace-pre-wrap">{gItem.body}</p>}
                           </div>
                         </div>
                       ))}
                     </div>
                   );
                }

                const isStacked = item.displayMode === 'stacked' || alignment === 'center' || !hasImage || !hasText;
                
                return (
                  <div 
                    key={i} 
                    onClick={() => item.link && navigate(item.link)}
                    className={`flex flex-col ${isStacked ? 'items-center text-center' : 'md:flex-row items-center gap-16'} w-full transition-all ${
                      item.link ? 'cursor-pointer hover:opacity-90 group/content' : ''
                    } ${
                      !isStacked && alignment === 'right' ? 'md:flex-row-reverse text-right' : 
                      !isStacked && alignment === 'left' ? 'text-left' : ''
                    }`}
                  >
                    {hasText && (
                      <div className={`flex-1 space-y-8 ${isStacked ? 'w-full' : ''}`}>
                        {item.title && <h2 style={titleStyles} className="text-5xl font-bold leading-tight tracking-tight group-hover/content:text-[var(--primary-color)] transition-colors">{item.title}</h2>}
                        {item.body && <div style={subtitleStyles} className="text-xl text-black/60 leading-relaxed whitespace-pre-wrap font-medium content-text">{item.body}</div>}
                      </div>
                    )}
                    {hasImage && (
                      <div className={`w-full ${hasText && !isStacked ? 'md:w-1/2' : 'w-full'} aspect-video rounded-[48px] overflow-hidden shadow-2xl transition-transform ${item.link ? 'group-hover/content:scale-[1.02]' : 'hover:scale-[1.02]'} duration-500`}>
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </StyledSectionWrap>
      );

    case 'testimonials':
      return (
        <StyledSectionWrap section={section}>
           <div className="space-y-12">
            {section.config.title && (
              <h2 style={titleStyles} className="text-3xl font-bold text-center">{section.config.title}</h2>
            )}
            <div 
              className={responsiveGridClass}
              style={{ gap }}
            >
              {(section.config.items || []).map((item: any, i: number) => (
                <div key={i} style={cardStyles} className="p-8 bg-white rounded-[40px] border border-black/5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex gap-1 text-[var(--primary-color)]">
                      {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                    </div>
                    <p style={subtitleStyles} className="text-lg text-black/60 leading-relaxed italic">"{item.text}"</p>
                  </div>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-color-light)] flex items-center justify-center text-[var(--primary-color)] font-bold text-sm">
                      {item.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-black">{item.name}</div>
                      <div className="text-[10px] uppercase tracking-widest opacity-40">Verified Customer</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StyledSectionWrap>
      );

    case 'faq':
      return (
        <StyledSectionWrap section={section}>
           <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 style={titleStyles} className="text-4xl font-bold tracking-tight">{section.config.title || 'Frequently Asked Questions'}</h2>
              <p style={subtitleStyles} className="text-black/40 max-w-2xl mx-auto">Find quick answers to common questions or chat with our AI assistant for personalized help.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-4">
                {(section.config.items || []).map((item: any, i: number) => (
                  <div key={i} style={cardStyles} className="p-6 bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all">
                    <h4 style={titleStyles} className="font-bold mb-3 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-[var(--primary-color-light)] text-[var(--primary-color)] rounded-lg flex items-center justify-center shrink-0">
                        <HelpCircle size={18} />
                      </div>
                      {item.q}
                    </h4>
                    <p style={subtitleStyles} className="text-black/60 leading-relaxed pl-11">{item.a}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Sparkles size={120} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-2xl font-bold">Can't find what you're looking for?</h3>
                    <p className="text-white/80 leading-relaxed">Our AI assistant is trained on our specific products and services to give you accurate, real-time answers. Just click the help icon at the bottom of your screen!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StyledSectionWrap>
      );

    case 'cta':
      return (
        <StyledSectionWrap section={section}>
           <div style={cardStyles} className="bg-[var(--primary-color)] rounded-[40px] p-16 text-center text-white shadow-2xl relative overflow-hidden my-12">
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 style={titleStyles} className="text-4xl font-bold">{section.config.title}</h2>
              <button 
                onClick={() => navigate(section.config.link || '#')}
                style={buttonStyles}
                className={`px-10 py-4 bg-white text-[var(--primary-color)] font-bold hover:bg-[var(--secondary-color)] hover:text-white transition-all shadow-xl ${
                  brandingConfig?.button_style === 'pill' ? 'rounded-full' : 
                  brandingConfig?.button_style === 'square' ? 'rounded-none' : 'rounded-2xl'
                }`}
              >
                {section.config.buttonText}
              </button>
            </div>
          </div>
        </StyledSectionWrap>
      );

    case 'carousel':
      return (
        <StyledSectionWrap section={section}>
          <Carousel 
            images={section.config.items || []} 
            height={section.config.height || "h-[500px]"}
            onNavigate={navigate}
          />
        </StyledSectionWrap>
      );

    default:
      return null;
  }
};

const ProductCard: React.FC<{ product: Product, onAddToCart: () => void }> = ({ product, onAddToCart }) => {
  const { config: brandingConfig } = useBranding();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [product.image_url, ...(product.images || [])]
    .filter(Boolean)
    .map(url => ensureAbsoluteUrl(url)) as string[];

  const buttonClass = `w-full flex items-center justify-center gap-2 py-4 bg-[var(--secondary-color)] text-white font-bold hover:bg-[var(--primary-color)] transition-all shadow-lg ${
    brandingConfig?.button_style === 'pill' ? 'rounded-full' : 
    brandingConfig?.button_style === 'square' ? 'rounded-none' : 'rounded-2xl'
  }`;

  const cardClass = `group bg-white border border-black/5 overflow-hidden hover:shadow-2xl transition-all ${
    brandingConfig?.button_style === 'pill' ? 'rounded-[40px]' : 
    brandingConfig?.button_style === 'square' ? 'rounded-none' : 'rounded-[32px]'
  }`;

  return (
    <div className={cardClass}>
      <div className="relative aspect-square overflow-hidden bg-gray-50 p-4">
        <img 
          src={images[currentImageIndex]} 
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
          {product.category ? decodeURIComponent(product.category) : 'General'}
        </div>
      </div>

      <div className="p-8 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg leading-tight group-hover:text-[var(--primary-color)] transition-colors" style={{ color: 'var(--secondary-color)' }}>
            {product.name}
          </h3>
          <div className="flex flex-col items-end">
            <span className="font-mono font-bold text-[var(--primary-color)]">
              {brandingConfig?.currency_symbol || '£'}{product.base_price.toFixed(2)}
            </span>
            {product.total_stock !== undefined && product.total_stock <= 0 && (
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">Out of Stock</span>
            )}
          </div>
        </div>
        
        <p className="text-sm text-black/40 line-clamp-2 leading-relaxed">
          {product.description || 'No description available for this premium product.'}
        </p>

        <button 
          onClick={onAddToCart}
          disabled={product.total_stock !== undefined && product.total_stock <= 0}
          className={`${buttonClass} ${product.total_stock !== undefined && product.total_stock <= 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
        >
          {product.total_stock !== undefined && product.total_stock <= 0 ? (
            <>
              <AlertTriangle size={18} />
              Out of Stock
            </>
          ) : (
            <>
              <Plus size={18} />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
};
