import React, { useEffect, useState } from 'react';
import { Product, FeatureFlag } from '../../shared/types';
import { Search, Plus, MoreHorizontal, Filter, X, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { token, user } = useAuth();
  const { addToCart } = useCart();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'client';

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    base_price: '',
    sale_percentage: '0',
    category: '',
    description: '',
    image_url: '',
    allow_direct_buy: true
  });

  const rfqEnabled = Boolean(features.find(f => f.feature_key === 'rfq_enabled')?.enabled ?? true);
  const b2bEnabled = Boolean(features.find(f => f.feature_key === 'b2b_enabled')?.enabled ?? true);

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts)
      .catch(err => console.error('Failed to fetch products:', err));
  };

  const fetchFeatures = () => {
    fetch('/api/admin/features', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setFeatures)
      .catch(err => console.error('Failed to fetch features:', err));
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
      setFormData({ sku: '', name: '', base_price: '', category: '', description: '', image_url: '', allow_direct_buy: true });
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
    setFormData({ sku: '', name: '', base_price: '', sale_percentage: '0', category: '', description: '', image_url: '', allow_direct_buy: true });
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

  const filteredProducts = products.filter(p => 
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())) &&
    (isAdmin || p.is_active)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-[#141414] pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-[#141414] text-sm hover:bg-white transition-colors">
            <Filter size={16} />
            Filter
          </button>
          {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#141414] text-[#E4E3E0] text-sm hover:bg-[#141414]/90 transition-colors"
            >
              <Plus size={16} />
              Add Product
            </button>
          )}
        </div>
      </div>

      <div className="border border-[#141414] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">
              <th className="p-4 font-medium">SKU</th>
              <th className="p-4 font-medium">Product Name</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Base Price</th>
              <th className="p-4 font-medium">Sale %</th>
              {isAdmin && <th className="p-4 font-medium">Direct Buy</th>}
              {isAdmin && <th className="p-4 font-medium">Status</th>}
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-white transition-colors group">
                <td className="p-4 text-xs font-mono text-[#141414]/60">{product.sku}</td>
                <td className="p-4 text-sm font-medium">{product.name}</td>
                <td className="p-4 text-xs text-[#141414]/60">{product.category || '-'}</td>
                <td className="p-4 text-sm font-mono">
                  {product.sale_percentage && product.sale_percentage > 0 ? (
                    <div className="flex flex-col">
                      <span className="line-through text-[10px] opacity-40">£{product.base_price.toFixed(2)}</span>
                      <span className="text-rose-600 font-bold">£{(product.base_price * (1 - product.sale_percentage / 100)).toFixed(2)}</span>
                    </div>
                  ) : (
                    `£${product.base_price.toFixed(2)}`
                  )}
                </td>
                <td className="p-4 text-sm font-mono">
                  {product.sale_percentage && product.sale_percentage > 0 ? (
                    <span className="text-rose-600 font-bold">{product.sale_percentage}%</span>
                  ) : (
                    <span className="opacity-30">-</span>
                  )}
                </td>
                {isAdmin && (
                  <td className="p-4">
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 ${
                      product.allow_direct_buy ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {product.allow_direct_buy ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                )}
                {isAdmin && (
                  <td className="p-4">
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 ${
                      product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                )}
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {!isAdmin && product.allow_direct_buy && (
                      <button 
                        onClick={() => {
                          addToCart(product, 1);
                          alert(`${product.name} added to cart!`);
                        }}
                        className="bg-[#141414] text-white px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                      >
                        <Plus size={12} />
                        Add to Cart
                      </button>
                    )}
                    {!isAdmin && rfqEnabled && (
                      <button 
                        onClick={() => handleRequestQuote(product)}
                        className="border border-[#141414] text-[#141414] px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:bg-white transition-all"
                      >
                        Request Quote
                      </button>
                    )}
                    {isAdmin && (
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-1 hover:bg-black/5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-[#141414]/40 italic font-serif">
            No products found matching your search criteria.
          </div>
        )}
      </div>

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
                    <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Base Price (£)</label>
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
