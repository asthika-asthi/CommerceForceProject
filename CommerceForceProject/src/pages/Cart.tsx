import React from 'react';
import { useCart } from '../context/CartContext';
import { useBranding } from '../context/BrandingContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export const Cart = ({ onCheckout, onBack }: { onCheckout: () => void; onBack: () => void }) => {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const { config: brandingConfig } = useBranding();
  const { user, setPendingAction } = useAuth();
  const currency = brandingConfig?.currency_symbol || '£';

  const handleCheckout = () => {
    if (!user) {
      setPendingAction({
        type: 'CHECKOUT',
        data: {},
        redirectTo: '/checkout'
      });
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onCheckout();
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-24 h-24 bg-[#141414]/5 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShoppingCart size={48} className="text-[#141414]/20" />
        </div>
        <h2 className="text-3xl font-bold text-[#141414] mb-4">Your cart is empty</h2>
        <p className="text-[#141414]/60 mb-10 max-w-md mx-auto">
          Looks like you haven't added anything to your cart yet. 
          Explore our products and find something you like!
        </p>
        <button
          onClick={onBack}
          className="bg-[#141414] text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center gap-3 mx-auto"
        >
          <ArrowLeft size={20} />
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold text-[#141414] flex items-center gap-4">
          <ShoppingCart size={36} />
          Shopping Cart
          <span className="text-lg font-normal text-[#141414]/40 ml-2">({totalItems} items)</span>
        </h1>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-[#141414]/60 hover:text-[#141414] transition-colors"
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          {items.map((item) => {
            if (!item.product) return null;
            return (
              <motion.div
                layout
                key={item.product.id}
                className="bg-white p-6 rounded-[32px] border border-[#141414]/5 shadow-sm flex gap-6 items-center"
              >
                <div className="w-24 h-24 bg-[#f5f5f5] rounded-2xl flex-shrink-0 overflow-hidden border border-[#141414]/5">
                  {item.product.image_url ? (
                    <img 
                      src={item.product.image_url} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#141414]/20">
                      <ShoppingCart size={32} />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-[#141414]">{item.product.name}</h3>
                      <p className="text-sm text-[#141414]/40 font-mono">SKU: {item.product.sku}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-[#141414]/20 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 bg-[#f5f5f5] rounded-xl px-3 py-1.5">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-white rounded-lg transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-sm font-bold font-mono w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-white rounded-lg transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#141414]/40 font-mono mb-1">
                        {item.product.sale_percentage && item.product.sale_percentage > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="line-through text-[8px] opacity-30">{currency}{(Number(item.product.base_price) || 0).toFixed(2)}</span>
                            <span className="text-rose-600 font-bold">{currency}{((Number(item.product.base_price) || 0) * (1 - (Number(item.product.sale_percentage) || 0) / 100)).toFixed(2)} each</span>
                          </div>
                        ) : (
                          `${currency}${(Number(item.product.base_price) || 0).toFixed(2)} each`
                        )}
                      </div>
                      <div className="text-xl font-bold font-mono">
                        {currency}{(((item.product.sale_percentage && item.product.sale_percentage > 0) ? ((Number(item.product.base_price) || 0) * (1 - (Number(item.product.sale_percentage) || 0) / 100)) : (Number(item.product.base_price) || 0)) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-[40px] border border-[#141414]/5 shadow-sm sticky top-8">
            <h2 className="text-2xl font-bold text-[#141414] mb-8">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-[#141414]/60">
                <span>Subtotal</span>
                <span className="font-mono">{currency}{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#141414]/60">
                <span>Shipping</span>
                <span className="font-mono text-green-600 font-bold uppercase text-xs tracking-widest">Free</span>
              </div>
              <div className="pt-6 border-t border-[#141414]/5 flex justify-between items-center">
                <span className="text-lg font-bold text-[#141414]">Total</span>
                <span className="text-3xl font-bold font-mono">{currency}{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full bg-[#141414] text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 hover:bg-black transition-all group"
            >
              Proceed to Checkout
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-[10px] text-[#141414]/40 mt-6 uppercase tracking-widest font-medium">
              Tax included • Secure Checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
