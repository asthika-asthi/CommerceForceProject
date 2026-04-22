import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../shared/types';
import { useAuth } from './AuthContext';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart when auth state is ready
  useEffect(() => {
    if (!isLoading) {
      const storageKey = user ? `cart_${user.id}` : 'cart_guest';
      const saved = localStorage.getItem(storageKey);
      setItems(saved ? JSON.parse(saved) : []);
      setIsInitialized(true);
    }
  }, [user?.id, isLoading]);

  // Save cart whenever items change
  useEffect(() => {
    if (isInitialized) {
      const storageKey = user ? `cart_${user.id}` : 'cart_guest';
      if (items.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, [items, user?.id, isInitialized]);

  // Merge guest cart into user cart on login
  useEffect(() => {
    if (!isLoading && user) {
      const guestCart = localStorage.getItem('cart_guest');
      if (guestCart) {
        try {
          const guestItems: CartItem[] = JSON.parse(guestCart);
          if (guestItems.length > 0) {
            setItems(prev => {
              const newItems = [...prev];
              guestItems.forEach(guestItem => {
                const existing = newItems.find(i => String(i.product.id) === String(guestItem.product.id));
                if (existing) {
                  existing.quantity += guestItem.quantity;
                } else {
                  newItems.push(guestItem);
                }
              });
              return newItems;
            });
          }
          localStorage.removeItem('cart_guest');
        } catch (e) {
          console.error('Failed to parse guest cart:', e);
          localStorage.removeItem('cart_guest');
        }
      }
    }
  }, [user?.id, isLoading]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => String(item.product.id) === String(product.id));
      if (existing) {
        return prev.map(item =>
          String(item.product.id) === String(product.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => String(item.product.id) !== String(productId)));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        String(item.product.id) === String(productId) ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + (item.quantity || 0), 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, item) => {
    if (!item.product) return sum;
    const basePrice = Number(item.product.base_price || 0);
    const salePercentage = Number(item.product.sale_percentage || 0);
    const price = salePercentage > 0
      ? basePrice * (1 - salePercentage / 100)
      : basePrice;
    return sum + (price * (item.quantity || 0));
  }, 0), [items]);

  const contextValue = useMemo(() => ({
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  }), [items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
