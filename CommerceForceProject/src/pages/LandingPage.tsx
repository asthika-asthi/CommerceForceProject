import React, { useEffect, useState } from 'react';
import { Product, LayoutSection } from '../shared/types';
import { useBranding } from '../context/BrandingContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight, Star, Shield, Truck, Plus, ChevronLeft, ChevronRight, HelpCircle, MessageSquare, Sparkles } from 'lucide-react';
import { AIChat } from '../components/AIChat';

export const LandingPage = ({ onShopNow }: { onShopNow: () => void }) => {
  const { config } = useBranding();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const layout: LayoutSection[] = React.useMemo(() => {
    if (!config?.layout_config) return [];
    try {
      return JSON.parse(config.layout_config);
    } catch (e) {
      console.error('Failed to parse layout_config:', e);
      return [];
    }
  }, [config?.layout_config]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/products');
        const allProducts: Product[] = await res.json();
        
        if (config?.featured_products) {
          const ids = config.featured_products.split(',').map(id => id.trim());
          setFeaturedProducts(allProducts.filter(p => ids.includes(p.id)));
        } else {
          setFeaturedProducts(allProducts.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, [config?.featured_products]);

  const buttonClass = `group flex items-center justify-center gap-3 px-10 py-5 font-bold transition-all shadow-xl ${
    config?.button_style === 'pill' ? 'rounded-full' : 
    config?.button_style === 'square' ? 'rounded-none' : 'rounded-2xl'
  } bg-[var(--primary-color)] text-white hover:opacity-90`;

  const navigate = (path: string) => {
    if (path.startsWith('/')) {
      const parts = path.split('/');
      const tab = parts[1];
      
      if (['products', 'contact', 'landing', 'cart', 'checkout', 'category'].includes(tab)) {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
        
        // If it's a product link, we might want to scroll to top or handle it specifically
        if (tab === 'products' && parts[2]) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        window.location.href = path;
      }
    } else {
      window.location.href = path;
    }
  };

  const renderSection = (section: LayoutSection) => {
    if (!section.enabled) return null;

    switch (section.type) {
      case 'features':
        return (
          <section key={section.id} className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
            {(section.config.items || []).map((feature: any, i: number) => (
              <div key={i} className="p-10 bg-white rounded-[32px] border border-black/5 shadow-sm hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-[var(--primary-color-light)] text-[var(--primary-color)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Star size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-black/50 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </section>
        );

      case 'promotions':
        return (
          <section key={section.id} className="py-12">
            <div className={`relative overflow-hidden rounded-[40px] p-12 flex flex-col md:flex-row items-center gap-10 ${section.config.variant === 'dark' ? 'bg-[var(--secondary-color)] text-white' : 'bg-white border border-black/5 shadow-sm'}`}>
              {section.config.image && (
                <div className="w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden">
                  <img src={section.config.image} alt="Promo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              <div className="flex-1 space-y-6 text-center md:text-left">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">{section.config.tag || 'Special Offer'}</span>
                <h2 className="text-4xl font-bold leading-tight">{section.config.title}</h2>
                <p className="text-lg opacity-60">{section.config.subtitle}</p>
                {section.config.buttonText && (
                  <button 
                    onClick={() => navigate(section.config.link || '#')}
                    className={`px-8 py-4 font-bold transition-all ${
                      config?.button_style === 'pill' ? 'rounded-full' : 
                      config?.button_style === 'square' ? 'rounded-none' : 'rounded-2xl'
                    } ${section.config.variant === 'dark' ? 'bg-white text-black hover:bg-[var(--primary-color)] hover:text-white' : 'bg-[var(--primary-color)] text-white hover:opacity-90'}`}
                  >
                    {section.config.buttonText}
                  </button>
                )}
              </div>
            </div>
          </section>
        );

      case 'products':
        return (
          <section key={section.id} className="space-y-12 py-12">
            <div className="flex items-end justify-between px-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{section.config.title || 'Featured Products'}</h2>
                <p className="text-black/40 font-medium">Handpicked selections just for you</p>
              </div>
              <button onClick={onShopNow} className="text-sm font-bold text-[var(--primary-color)] hover:underline flex items-center gap-2">
                View All <ArrowRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product, 1)} />
              ))}
            </div>
          </section>
        );

      case 'content':
        const items = section.config.items || [{ title: section.config.title, body: section.config.body, alignment: 'center' }];
        const isGrid = section.config.layoutType === 'grid';
        const gridItems = items.filter((item: any) => item.includeInGrid);
        const hasGridItems = gridItems.length > 0;

        return (
          <section key={section.id} className="py-20 space-y-16">
            {section.config.title && (
               <h2 className="text-4xl font-bold text-center mb-12">{section.config.title}</h2>
            )}
            
            <div className="space-y-24">
              {items.map((item: any, i: number) => {
                const hasImage = !!item.imageUrl;
                const hasText = !!(item.title || item.body);
                const alignment = item.alignment || 'center';
                
                if (isGrid && item.includeInGrid) {
                   const firstGridIndex = items.findIndex((it: any) => it.includeInGrid);
                   if (i !== firstGridIndex) return null;

                   return (
                     <div key={`grid-${i}`} className="grid gap-8 max-w-7xl mx-auto px-4" style={{ 
                       gridTemplateColumns: `repeat(${section.config.columns || 3}, minmax(0, 1fr))`,
                     }}>
                       {gridItems.map((gItem: any, gi: number) => (
                         <div 
                           key={gi} 
                           onClick={() => gItem.link && navigate(gItem.link)}
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
                           <div className="space-y-3 flex-1">
                             {gItem.title && <h3 className="text-2xl font-bold">{gItem.title}</h3>}
                             {gItem.body && <p className="text-black/60 leading-relaxed whitespace-pre-wrap">{gItem.body}</p>}
                           </div>
                         </div>
                       ))}
                     </div>
                   );
                }

                const isStacked = alignment === 'center' || !hasImage || !hasText;
                
                return (
                  <div 
                    key={i} 
                    onClick={() => item.link && navigate(item.link)}
                    className={`flex flex-col ${isStacked ? 'items-center text-center' : 'md:flex-row items-center gap-16'} max-w-7xl mx-auto px-6 transition-all ${
                      item.link ? 'cursor-pointer hover:opacity-90 group/content' : ''
                    } ${
                      !isStacked && alignment === 'right' ? 'md:flex-row-reverse text-right' : 
                      !isStacked && alignment === 'left' ? 'text-left' : ''
                    }`}
                  >
                    {hasImage && (
                      <div className={`w-full ${hasText && !isStacked ? 'md:w-1/2' : 'max-w-5xl'} aspect-video rounded-[48px] overflow-hidden shadow-2xl transition-transform ${item.link ? 'group-hover/content:scale-[1.02]' : 'hover:scale-[1.02]'} duration-500`}>
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    {hasText && (
                      <div className={`flex-1 space-y-8 ${isStacked ? 'max-w-4xl' : ''}`}>
                        {item.title && <h2 className="text-5xl font-bold leading-tight tracking-tight group-hover/content:text-[var(--primary-color)] transition-colors">{item.title}</h2>}
                        {item.body && <div className="text-xl text-black/60 leading-relaxed whitespace-pre-wrap font-medium">{item.body}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section key={section.id} className="py-20 space-y-12 max-w-7xl mx-auto px-4">
            {section.config.title && (
              <h2 className="text-3xl font-bold text-center">{section.config.title}</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(section.config.items || []).map((item: any, i: number) => (
                <div key={i} className="p-8 bg-white rounded-[40px] border border-black/5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex gap-1 text-[var(--primary-color)]">
                      {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                    </div>
                    <p className="text-lg text-black/60 leading-relaxed italic">"{item.text}"</p>
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
          </section>
        );

      case 'faq':
        return (
          <section key={section.id} className="py-20 max-w-7xl mx-auto px-4 space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">{section.config.title || 'Frequently Asked Questions'}</h2>
              <p className="text-black/40 max-w-2xl mx-auto">Find quick answers to common questions or chat with our AI assistant for personalized help.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-4">
                {(section.config.items || []).map((item: any, i: number) => (
                  <div key={i} className="p-6 bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all">
                    <h4 className="font-bold mb-3 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-[var(--primary-color-light)] text-[var(--primary-color)] rounded-lg flex items-center justify-center shrink-0">
                        <HelpCircle size={18} />
                      </div>
                      {item.q}
                    </h4>
                    <p className="text-black/60 leading-relaxed pl-11">{item.a}</p>
                  </div>
                ))}
                {(!section.config.items || section.config.items.length === 0) && (
                  <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-black/10 opacity-40">
                    No FAQs added yet.
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Sparkles size={120} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-2xl font-bold">Can't find what you're looking for?</h3>
                    <p className="text-white/80 leading-relaxed">Our AI assistant is trained on our specific products and services to give you accurate, real-time answers.</p>
                  </div>
                </div>
                <AIChat />
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section key={section.id} className="bg-[var(--primary-color)] rounded-[40px] p-16 text-center text-white shadow-2xl relative overflow-hidden my-12">
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-4xl font-bold">{section.config.title}</h2>
              <button 
                onClick={() => navigate(section.config.link || '#')}
                className={`px-10 py-4 bg-white text-[var(--primary-color)] font-bold hover:bg-[var(--secondary-color)] hover:text-white transition-all shadow-xl ${
                  config?.button_style === 'pill' ? 'rounded-full' : 
                  config?.button_style === 'square' ? 'rounded-none' : 'rounded-2xl'
                }`}
              >
                {section.config.buttonText}
              </button>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Hero Section */}
      <section className="relative h-[600px] rounded-[40px] overflow-hidden group">
        {config?.hero_image_url ? (
          config.hero_image_url.endsWith('.mp4') ? (
            <video autoPlay muted loop className="absolute inset-0 w-full h-full object-cover">
              <source src={config.hero_image_url} type="video/mp4" />
            </video>
          ) : (
            <img 
              src={config.hero_image_url} 
              alt="Hero" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-color)] to-black" />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight"
          >
            {config?.hero_title || 'Welcome to Our Premium Store'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed"
          >
            {config?.hero_subtitle || 'Discover our exclusive collection of high-quality products designed for professionals and enthusiasts alike.'}
          </motion.p>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => config?.hero_cta_link ? navigate(config.hero_cta_link) : onShopNow()}
            className={buttonClass}
          >
            {config?.hero_cta_text || 'Explore Collection'}
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>
      </section>

      {/* Dynamic Sections */}
      {layout.map(renderSection)}

      {/* Default Features if no layout */}
      {layout.length === 0 && (
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

const ProductCard: React.FC<{ product: Product, onAddToCart: () => void }> = ({ product, onAddToCart }) => {
  const { config } = useBranding();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [product.image_url, ...(product.images || [])].filter(Boolean) as string[];

  const buttonClass = `w-full flex items-center justify-center gap-2 py-4 bg-[var(--secondary-color)] text-white font-bold hover:bg-[var(--primary-color)] transition-all shadow-lg ${
    config?.button_style === 'pill' ? 'rounded-full' : 
    config?.button_style === 'square' ? 'rounded-none' : 'rounded-2xl'
  }`;

  return (
    <div className="group bg-white rounded-[32px] border border-black/5 overflow-hidden hover:shadow-2xl transition-all">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img 
          src={images[currentImageIndex] || 'https://picsum.photos/seed/product/800/800'} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
          {product.category || 'General'}
        </div>
      </div>

      <div className="p-8 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg leading-tight group-hover:text-[var(--primary-color)] transition-colors" style={{ color: 'var(--secondary-color)' }}>
            {product.name}
          </h3>
          <span className="font-mono font-bold text-[var(--primary-color)]">
            £{product.base_price.toFixed(2)}
          </span>
        </div>
        
        <p className="text-sm text-black/40 line-clamp-2 leading-relaxed">
          {product.description || 'No description available for this premium product.'}
        </p>

        <button 
          onClick={onAddToCart}
          className={buttonClass}
        >
          <Plus size={18} />
          Add to Cart
        </button>
      </div>
    </div>
  );
};
