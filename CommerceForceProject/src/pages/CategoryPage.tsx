import React, { useEffect, useState } from 'react';
import { Product } from '../shared/types';
import { useBranding } from '../context/BrandingContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ArrowLeft, Plus, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

const ensureAbsoluteUrl = (url: string | undefined) => {
  if (!url) return url;
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  return `/${url}`;
};

export const CategoryPage = ({ categoryName: rawCategoryName, onBack }: { categoryName: string, onBack: () => void }) => {
  const categoryName = decodeURIComponent(rawCategoryName);
  const { config: brandingConfig } = useBranding();
  const { user, setPendingAction } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uiConfig, setUiConfig] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [currentCategory, setCurrentCategory] = useState<any>(null);

  const requireAuth = (product: Product) => {
    if (!user) {
      setPendingAction({
        type: 'ADD_TO_CART',
        data: { product, quantity: 1 },
        redirectTo: window.location.pathname
      });
      // Trigger navigation to login
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config/category');
        if (res.ok) {
          const data = await res.json();
          setUiConfig(data);
        }
      } catch (err) {
        console.error('Failed to fetch category config:', err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch categories
        const catsRes = await fetch('/api/categories');
        const allCats = await catsRes.json();
        setAllCategories(allCats);
        
        const current = allCats.find((c: any) => c.slug === categoryName || c.name.toLowerCase() === categoryName.toLowerCase());
        setCurrentCategory(current);

        // 2. Fetch products
        const productsRes = await fetch('/api/products');
        const allProducts: Product[] = await productsRes.json();

        if (current) {
          const children = allCats.filter((c: any) => c.parent_id === current.id);
          if (children.length > 0) {
            setSubCategories(children.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)));
            // Clear products because we only want to show sub-categories if they exist
            setProducts([]);
          } else {
            // No sub-categories, just products in this category
            const filtered = allProducts.filter(p => {
              // Prefer category_id for accurate matching
              if (p.category_id !== undefined && p.category_id !== null) {
                return p.category_id === current.id;
              }
              // Fallback to name for legacy data
              const productCat = p.category ? decodeURIComponent(p.category).toLowerCase() : 'general';
              const targetName = current.name.toLowerCase();
              return productCat === targetName || (targetName === 'general' && !p.category);
            });
            setProducts(filtered);
            setSubCategories([]);
          }
        } else {
          // If category not found in manual list, fallback to name-based product filter
          const filtered = allProducts.filter(p => {
            const productCat = p.category ? decodeURIComponent(p.category).toLowerCase() : 'general';
            const targetCat = categoryName.toLowerCase();
            return productCat === targetCat || (targetCat === 'general' && !p.category);
          });
          setProducts(filtered);
          setSubCategories([]);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryName]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)]"></div>
      </div>
    );
  }

  const renderLayoutItem = (item: any) => {
    switch (item.type) {
      case 'banner':
        const parentCategory = currentCategory?.parent_id ? allCategories.find(c => c.id === currentCategory.parent_id) : null;
        const bannerImage = item.image || currentCategory?.image_url || parentCategory?.image_url;
        return (
          <div key="banner" className="relative h-[300px] rounded-[40px] overflow-hidden mb-8">
            {bannerImage ? (
              <img 
                src={ensureAbsoluteUrl(bannerImage)} 
                alt={categoryName}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="absolute inset-0 bg-gradient-to-br from-[var(--primary-color)] to-black" 
                style={item.backgroundColor ? { backgroundImage: `linear-gradient(to bottom right, ${item.backgroundColor}, black)` } : {}}
              />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <h1 className="text-5xl font-bold text-white tracking-tight capitalize">{categoryName}</h1>
            </div>
          </div>
        );
      case 'title':
        return (
          <div key="title" className="flex items-center gap-4 px-4 mb-8">
            <button 
              onClick={onBack}
              className="p-3 hover:bg-black/5 rounded-full transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight capitalize">{categoryName}</h1>
              {subCategories.length > 0 ? (
                <p className="text-black/40 font-medium">Explore sub-categories in {categoryName}</p>
              ) : (
                <p className="text-black/40 font-medium">Showing {products.length} products</p>
              )}
            </div>
          </div>
        );
      case 'product_grid':
        if (subCategories.length > 0) {
          return (
            <div key="subcategory_grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subCategories.map((sub) => (
                <button 
                  key={sub.id}
                  onClick={() => {
                    window.history.pushState({}, '', `/category/${encodeURIComponent(sub.slug)}`);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="group relative h-64 rounded-[40px] overflow-hidden border border-black/5 hover:shadow-2xl transition-all"
                >
                  {sub.image_url ? (
                    <img 
                      src={ensureAbsoluteUrl(sub.image_url)} 
                      alt={sub.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#141414] to-[#404040]" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-8 text-center group-hover:bg-black/60 transition-colors">
                    <h3 className="text-2xl font-bold text-white tracking-tight capitalize">{sub.name}</h3>
                    {sub.description && (
                      <p className="text-white/60 text-sm mt-2 line-clamp-2">{sub.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          );
        }
        return (
          <div key="grid">
            {products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[40px] border border-black/5">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold">No products found</h3>
                <p className="text-black/40">We couldn't find any products in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
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
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const layout = uiConfig?.layout || [
    { type: 'title' },
    { type: 'product_grid' }
  ];

  return (
    <div className="space-y-12 pb-24">
      {layout.map(renderLayoutItem)}
    </div>
  );
};

const ProductCard: React.FC<{ product: Product, onAddToCart: () => void }> = ({ product, onAddToCart }) => {
  const { config } = useBranding();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [product.image_url, ...(product.images || [])]
    .filter(Boolean)
    .map(url => ensureAbsoluteUrl(url)) as string[];

  const buttonClass = `w-full flex items-center justify-center gap-2 py-4 bg-[var(--secondary-color)] text-white font-bold hover:bg-[var(--primary-color)] transition-all shadow-lg ${
    config?.button_style === 'pill' ? 'rounded-full' : 
    config?.button_style === 'square' ? 'rounded-none' : 'rounded-2xl'
  }`;

  const cardClass = `group bg-white border border-black/5 overflow-hidden hover:shadow-2xl transition-all h-full flex flex-col ${
    config?.button_style === 'pill' ? 'rounded-[40px]' : 
    config?.button_style === 'square' ? 'rounded-none' : 'rounded-[32px]'
  }`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cardClass}
    >
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
      </div>

      <div className="p-8 space-y-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-lg leading-tight group-hover:text-[var(--primary-color)] transition-colors line-clamp-2" style={{ color: 'var(--secondary-color)' }}>
            {product.name}
          </h3>
          <div className="flex flex-col items-end">
            <span className="font-mono font-bold text-[var(--primary-color)] whitespace-nowrap">
              {config?.currency_symbol || '£'}{product.base_price.toFixed(2)}
            </span>
            {product.total_stock !== undefined && product.total_stock <= 0 && (
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">Out of Stock</span>
            )}
          </div>
        </div>
        
        <p className="text-sm text-black/40 line-clamp-2 leading-relaxed flex-1">
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
    </motion.div>
  );
};
