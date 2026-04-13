import React, { useEffect, useState } from 'react';
import { Product, FeatureFlag } from '../../shared/types';
import { useBranding } from '../../context/BrandingContext';
import { Search, Plus, MoreHorizontal, Filter, X, Loader2, AlertCircle, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

const CustomerProductCard: React.FC<{ product: Product, onAddToCart: () => void, onQuote: () => void, rfqEnabled: boolean }> = ({ product, onAddToCart, onQuote, rfqEnabled }) => {
  const { config: brandingConfig } = useBranding();
  const currency = brandingConfig?.currency_symbol || '£';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [product.image_url, ...(product.images || [])].filter(Boolean) as string[];

  return (
    <div className="group bg-white rounded-[32px] border border-black/5 overflow-hidden hover:shadow-2xl transition-all flex flex-col">
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

      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-base leading-tight group-hover:text-[var(--primary-color)] transition-colors">
            {product.name}
          </h3>
          <div className="flex flex-col items-end">
            <span className="font-mono font-bold text-[var(--primary-color)]">
              {currency}{product.base_price.toFixed(2)}
            </span>
            {product.sale_percentage ? (
              <span className="text-[10px] text-rose-600 font-bold">-{product.sale_percentage}%</span>
            ) : null}
          </div>
        </div>
        
        <p className="text-xs text-black/40 line-clamp-2 leading-relaxed flex-1">
          {product.description || 'No description available for this premium product.'}
        </p>

        <div className="flex flex-col gap-2 pt-2">
          {product.allow_direct_buy && (
            <button 
              onClick={onAddToCart}
              className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-[var(--primary-color)] transition-all shadow-md"
            >
              <Plus size={14} />
              Add to Cart
            </button>
          )}
          {rfqEnabled && (
            <button 
              onClick={onQuote}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-black/5 text-black rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
            >
              Request Quote
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useAuth();
  const { addToCart } = useCart();
  const { config: brandingConfig } = useBranding();
  const currency = brandingConfig?.currency_symbol || '£';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'client';

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    base_price: '',
    sale_percentage: '0',
    category: '',
    description: '',
    image_url: '',
    images: [] as string[],
    allow_direct_buy: true
  });

  const rfqEnabled = Boolean(features.find(f => f.feature_key === 'rfq_enabled')?.enabled ?? true);
  const b2bEnabled = Boolean(features.find(f => f.feature_key === 'b2b_enabled')?.enabled ?? true);

  const fetchProducts = () => {
    setIsLoading(true);
    fetch('/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      })
      .finally(() => setIsLoading(false));
  };

  const fetchFeatures = () => {
    fetch('/api/admin/features', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeatures(data);
        } else {
          setFeatures([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch features:', err);
        setFeatures([]);
      });
  };

  useEffect(() => {
    fetchProducts();
    if (token) fetchFeatures();
  }, [token]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      base_price: product.base_price.toString(),
      sale_percentage: (product.sale_percentage || 0).toString(),
      category: product.category || '',
      description: product.description || '',
      image_url: product.image_url || '',
      images: product.images || [],
      allow_direct_buy: product.allow_direct_buy
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          base_price: parseFloat(formData.base_price),
          sale_percentage: parseFloat(formData.sale_percentage || '0'),
          allow_direct_buy: formData.allow_direct_buy ? 1 : 0
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${editingProduct ? 'update' : 'create'} product`);
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ sku: '', name: '', base_price: '', sale_percentage: '0', category: '', description: '', image_url: '', images: [], allow_direct_buy: true });
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ sku: '', name: '', base_price: '', sale_percentage: '0', category: '', description: '', image_url: '', images: [], allow_direct_buy: true });
  };

  const handleAddImageUrl = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const handleUpdateImageUrl = (index: number, url: string) => {
    const newImages = [...formData.images];
    newImages[index] = url;
    setFormData({ ...formData, images: newImages });
  };

  const handleRemoveImageUrl = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const handleBuyNow = async (product: Product) => {
    if (!token) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: 1 }],
          paymentMethod: 'prepaid'
        })
      });
      if (res.ok) {
        alert('Order placed successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to place order');
      }
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  const handleRequestQuote = async (product: Product) => {
    if (!token) return;
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: 1 }],
          notes: `Quote request for ${product.name}`
        })
      });
      if (res.ok) {
        alert('RFQ submitted successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit RFQ');
      }
    } catch (err) {
      console.error('Failed to submit RFQ:', err);
    }
  };

  const filteredProducts = products.filter(p => {
    if (!p) return false;
    const nameMatch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    const skuMatch = (p.sku || '').toLowerCase().includes(search.toLowerCase());
    return (nameMatch || skuMatch) && (isAdmin || p.is_active);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin opacity-20" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-black/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-black/5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
            <Filter size={16} />
            Filter
          </button>
          {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary-color)] text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[var(--primary-color)]/20"
            >
              <Plus size={18} />
              Add Product
            </button>
          )}
        </div>
      </div>

      {isAdmin ? (
        <div className="bg-white rounded-[32px] border border-black/5 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 text-[#141414] text-[10px] font-mono uppercase tracking-widest">
                <th className="p-6 font-bold">SKU</th>
                <th className="p-6 font-bold">Product Name</th>
                <th className="p-6 font-bold">Category</th>
                <th className="p-6 font-bold">Base Price</th>
                <th className="p-6 font-bold">Sale %</th>
                <th className="p-6 font-bold">Direct Buy</th>
                <th className="p-6 font-bold">Status</th>
                <th className="p-6 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-6 text-xs font-mono text-[#141414]/60">{product.sku}</td>
                  <td className="p-6 text-sm font-bold">{product.name}</td>
                  <td className="p-6 text-xs text-[#141414]/60">{product.category || '-'}</td>
                  <td className="p-6 text-sm font-mono font-bold">
                    {product.base_price !== undefined && product.base_price !== null ? (
                      product.sale_percentage && product.sale_percentage > 0 ? (
                        <div className="flex flex-col">
                          <span className="line-through text-[10px] opacity-40">{currency}{(Number(product.base_price) || 0).toFixed(2)}</span>
                          <span className="text-rose-600">{currency}{((Number(product.base_price) || 0) * (1 - (Number(product.sale_percentage) || 0) / 100)).toFixed(2)}</span>
                        </div>
                      ) : (
                        `${currency}${(Number(product.base_price) || 0).toFixed(2)}`
                      )
                    ) : '-'}
                  </td>
                  <td className="p-6 text-sm font-mono">
                    {product.sale_percentage && product.sale_percentage > 0 ? (
                      <span className="text-rose-600 font-bold">{product.sale_percentage}%</span>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>
                  <td className="p-6">
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full font-bold ${
                      product.allow_direct_buy ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {product.allow_direct_buy ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full font-bold ${
                      product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="p-2 hover:bg-black/5 rounded-xl transition-all"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <CustomerProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={() => addToCart(product, 1)}
              onQuote={() => handleRequestQuote(product)}
              rfqEnabled={rfqEnabled}
            />
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="p-20 text-center bg-white rounded-[40px] border border-black/5 shadow-sm">
          <AlertCircle className="mx-auto mb-4 opacity-20" size={48} />
          <p className="text-lg font-bold opacity-40">No products found matching your search.</p>
        </div>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[24px] shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#141414]">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">SKU</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={e => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                      placeholder="PROD-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Base Price ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.base_price}
                      onChange={e => setFormData({...formData, base_price: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Sale Discount (%)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.sale_percentage}
                      onChange={e => setFormData({...formData, sale_percentage: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                    placeholder="e.g. Electronics"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Main Image URL</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 ml-1">
                    <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider">Gallery Images (Min 4 recommended)</label>
                    <button 
                      type="button"
                      onClick={handleAddImageUrl}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                    >
                      + Add Image
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                    {formData.images.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={url}
                          onChange={e => handleUpdateImageUrl(index, e.target.value)}
                          className="flex-1 px-4 py-2 rounded-xl border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                          placeholder={`Gallery Image ${index + 1}`}
                        />
                        <button 
                          type="button"
                          onClick={() => handleRemoveImageUrl(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {formData.images.length === 0 && (
                      <p className="text-[10px] text-center opacity-40 italic py-2">No gallery images added yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Main Image URL</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 ml-1">
                    <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider">Gallery Images (Min 4 recommended)</label>
                    <button 
                      type="button"
                      onClick={handleAddImageUrl}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                    >
                      + Add Image
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                    {formData.images.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={url}
                          onChange={e => handleUpdateImageUrl(index, e.target.value)}
                          className="flex-1 px-4 py-2 rounded-xl border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                          placeholder={`Gallery Image ${index + 1}`}
                        />
                        <button 
                          type="button"
                          onClick={() => handleRemoveImageUrl(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {formData.images.length === 0 && (
                      <p className="text-[10px] text-center opacity-40 italic py-2">No gallery images added yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all h-24 resize-none"
                    placeholder="Product description..."
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#f9f9f9] rounded-xl border border-[#f0f0f0]">
                  <input
                    type="checkbox"
                    id="allow_direct_buy"
                    checked={formData.allow_direct_buy}
                    onChange={e => setFormData({...formData, allow_direct_buy: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-[#141414] focus:ring-[#141414]"
                  />
                  <label htmlFor="allow_direct_buy" className="text-sm font-medium text-[#141414]">
                    Allow Direct Buy (B2C Mode)
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 border border-[#e5e5e5] rounded-xl font-medium hover:bg-[#f5f5f5] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#141414] text-white py-3 rounded-xl font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingProduct ? 'Update Product' : 'Create Product')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
