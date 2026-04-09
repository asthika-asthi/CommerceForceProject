import React, { useEffect, useState } from 'react';
import { Product } from '../shared/types';
import { useBranding } from '../context/BrandingContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export const CategoryPage = ({ categoryName, onBack }: { categoryName: string, onBack: () => void }) => {
  const { config } = useBranding();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const allProducts: Product[] = await res.json();
        // Filter by category (case-insensitive)
        const filtered = allProducts.filter(p => 
          p.category?.toLowerCase() === categoryName.toLowerCase() ||
          (categoryName.toLowerCase() === 'general' && !p.category)
        );
        setProducts(filtered);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryName]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      <div className="flex items-center gap-4 px-4">
        <button 
          onClick={onBack}
          className="p-3 hover:bg-black/5 rounded-full transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-4xl font-bold tracking-tight capitalize">{categoryName}</h1>
          <p className="text-black/40 font-medium">Showing {products.length} products</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[40px] border border-black/5">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold">No products found</h3>
          <p className="text-black/40">We couldn't find any products in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product, 1)} />
          ))}
        </div>
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-[32px] border border-black/5 overflow-hidden hover:shadow-2xl transition-all h-full flex flex-col"
    >
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
      </div>

      <div className="p-8 space-y-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-lg leading-tight group-hover:text-[var(--primary-color)] transition-colors line-clamp-2" style={{ color: 'var(--secondary-color)' }}>
            {product.name}
          </h3>
          <span className="font-mono font-bold text-[var(--primary-color)] whitespace-nowrap">
            £{product.base_price.toFixed(2)}
          </span>
        </div>
        
        <p className="text-sm text-black/40 line-clamp-2 leading-relaxed flex-1">
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
    </motion.div>
  );
};
