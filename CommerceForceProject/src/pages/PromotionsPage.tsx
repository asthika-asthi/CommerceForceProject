import React, { useEffect, useState } from 'react';
import { Product, Coupon } from '../shared/types';
import { useBranding } from '../context/BrandingContext';
import { motion } from 'motion/react';
import { Tag, Ticket, Percent, Calendar, ShoppingBag, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const PromotionsPage = () => {
  const { config: brandingConfig } = useBranding();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, couponsRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/coupons')
        ]);
        
        const productsData = await productsRes.json();
        const couponsData = await couponsRes.json();
        
        // Filter for active sale products
        const saleProducts = Array.isArray(productsData) 
          ? productsData.filter((p: Product) => (p.sale_percentage || 0) > 0 && p.is_active)
          : [];

        // Filter for active non-expired coupons
        const activeCoupons = Array.isArray(couponsData)
          ? couponsData.filter((c: Coupon) => {
              if (!c.is_active) return false;
              if (c.expiry_date && new Date(c.expiry_date) < new Date()) return false;
              if (c.usage_limit && c.used_count >= c.usage_limit) return false;
              return true;
            })
          : [];
        
        setProducts(saleProducts);
        setCoupons(activeCoupons);
      } catch (err) {
        console.error('Failed to fetch promotions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary-color)]" size={48} />
      </div>
    );
  }

  const primaryColor = brandingConfig?.primary_color || '#141414';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      {/* Header */}
      <div className="text-center mb-16 md:mb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary-color-light)] text-[var(--primary-color)] rounded-full text-xs font-bold uppercase tracking-widest mb-6"
        >
          <Sparkles size={14} />
          Exclusive Offers
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold mb-6 font-serif italic tracking-tight"
        >
          Sales & Promotions
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-black/50 max-w-2xl mx-auto leading-relaxed"
        >
          Discover current discounts, limited-time offers, and special promotional coupons curated just for you.
        </motion.p>
      </div>

      {/* Coupons Section */}
      {coupons.length > 0 && (
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Ticket size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight uppercase tracking-widest text-sm opacity-40">Active Coupons</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coupons.map((coupon, idx) => (
              <motion.div 
                key={coupon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative group h-full"
              >
                {/* Dotted border background */}
                <div className="absolute inset-0 border-2 border-dashed border-amber-200 rounded-3xl transition-colors group-hover:border-amber-400" />
                
                <div className="relative p-8 bg-white rounded-3xl m-1 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                      {coupon.type === 'percentage' ? <Percent size={24} /> : <Tag size={24} />}
                    </div>
                    <div className="text-right">
                      <span className="block text-3xl font-black text-amber-600">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `${brandingConfig?.currency_symbol || '£'}${coupon.value}`}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Off Your Order</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-4 font-mono">{coupon.code}</h3>
                    <p className="text-sm opacity-60 mb-6 leading-relaxed">
                      {coupon.min_order_amount > 0 ? `Valid for orders over ${brandingConfig?.currency_symbol || '£'}${coupon.min_order_amount}. ` : 'No minimum order required. '}
                      {coupon.max_discount_amount ? `Maximum discount up to ${brandingConfig?.currency_symbol || '£'}${coupon.max_discount_amount}.` : ''}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-black/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
                      <Calendar size={12} />
                      <span>{coupon.expiry_date ? `Expires: ${new Date(coupon.expiry_date).toLocaleDateString()}` : 'No Expiry'}</span>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.code);
                        alert('Code copied to clipboard!');
                      }}
                      className="text-xs font-bold text-amber-600 hover:underline"
                    >
                      Copy Code
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Sale Items Section */}
      {products.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShoppingBag size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight uppercase tracking-widest text-sm opacity-40">Flash Sale Items</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, idx) => {
              const salePrice = product.base_price * (1 - (product.sale_percentage || 0) / 100);
              
              return (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="group bg-white rounded-[32px] border border-black/5 overflow-hidden hover:shadow-2xl transition-all h-full flex flex-col"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 py-1.5 px-3 bg-rose-600 text-white text-[10px] font-bold rounded-full shadow-lg">
                      -{product.sale_percentage}%
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="text-[10px] text-black/40 font-bold uppercase tracking-[0.2em] mb-2">{product.category}</div>
                    <h3 className="text-lg font-bold mb-4 group-hover:text-[var(--primary-color)] transition-colors">{product.name}</h3>
                    
                    <div className="mt-auto flex items-baseline gap-3 mb-6">
                      <span className="text-2xl font-bold">{brandingConfig?.currency_symbol || '£'}{salePrice.toFixed(2)}</span>
                      <span className="text-sm text-black/30 line-through">{brandingConfig?.currency_symbol || '£'}{product.base_price.toFixed(2)}</span>
                    </div>

                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full py-4 bg-white border border-[#141414]/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-white hover:border-[#141414] transition-all"
                    >
                      Add to Cart
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {products.length === 0 && coupons.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[48px] border border-black/5 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-8">
            <Ticket size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-4">No active promotions</h2>
          <p className="text-black/40 mb-10 max-w-md mx-auto">Check back later for exclusive deals and seasonal discounts! We are always updating our offers.</p>
          <button 
            onClick={() => navigate('/products')}
            className="px-8 py-4 bg-[#141414] text-white rounded-full font-bold hover:bg-black transition-all"
          >
            Browse Products
          </button>
        </div>
      )}
      
      {/* Loyalty Referral Banner if both empty or just as a footer */}
      <div className="mt-24 p-12 bg-black text-white rounded-[48px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary-color)] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-serif italic tracking-tight">Wait, there's more...</h2>
            <p className="text-white/60 mb-8 leading-relaxed">
              Join our loyalty program to earn points on every purchase. Redeem points for exclusive vouchers and access limited member-only sales events.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-[var(--primary-color)] hover:text-white transition-all shadow-xl shadow-black/20"
              >
                Join Now
              </button>
              <button 
                onClick={() => navigate('/faq')}
                className="px-8 py-4 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 border-2 border-white/10 rounded-full flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/20 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                  <Sparkles className="text-[var(--primary-color)]" size={32} />
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black p-6 rounded-3xl font-black text-4xl shadow-2xl">
                VIP
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
