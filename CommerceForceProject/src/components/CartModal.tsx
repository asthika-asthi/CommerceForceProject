import React from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CartModal = ({ isOpen, onClose, onCheckout, onViewCart }: { isOpen: boolean; onClose: () => void; onCheckout: () => void; onViewCart: () => void }) => {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md h-full bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-[#141414]/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#141414]/5 rounded-full flex items-center justify-center">
              <ShoppingCart size={20} className="text-[#141414]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#141414]">Your Cart</h2>
              <p className="text-xs text-[#141414]/40 font-medium">{totalItems} items</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <ShoppingBag size={64} strokeWidth={1} />
              <p className="text-sm font-medium italic font-serif">Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-4 group">
                <div className="w-20 h-20 bg-[#f5f5f5] rounded-2xl flex-shrink-0 overflow-hidden border border-[#141414]/5">
                  {item.product.image_url ? (
                    <img 
                      src={item.product.image_url} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#141414]/20">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-[#141414] line-clamp-1">{item.product.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[#141414]/20 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-[#141414]/40 font-mono mt-1">£{item.product.base_price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 bg-[#f5f5f5] rounded-lg px-2 py-1">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-white rounded-md transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold font-mono w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-white rounded-md transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-bold font-mono">
                      £{(item.product.base_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-[#f5f5f5] rounded-t-[32px] space-y-3">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-medium text-[#141414]/60">Total Amount</span>
              <span className="text-xl font-bold font-mono">£{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all group"
              >
                Checkout Now
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onViewCart}
                className="w-full border border-[#141414] text-[#141414] py-3 rounded-2xl font-bold text-sm hover:bg-white transition-all"
              >
                View Full Cart
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
