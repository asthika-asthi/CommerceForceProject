import React, { useEffect, useState } from 'react';
import { Warehouse, Inventory, Product, FeatureFlag } from '../../shared/types';
import { Search, Plus, MoreHorizontal, Filter, Loader2, Warehouse as WarehouseIcon, Package, AlertTriangle, X, Settings, ArrowRightLeft, ShoppingCart, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export const InventoryPage = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const { token, user } = useAuth();
  const { addToCart } = useCart();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'client';
  const rfqEnabled = Boolean(features.find(f => f.feature_key === 'rfq_enabled')?.enabled ?? true);

  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    location: ''
  });

  const [stockForm, setStockForm] = useState({
    productId: '',
    quantity: '',
    minStockLevel: ''
  });

  const fetchWarehouses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWarehouses(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedWarehouse) {
          setSelectedWarehouse(data[0]);
        }
      } else {
        console.error('Failed to fetch warehouses:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventory = async (warehouseId: string) => {
    try {
      const res = await fetch(`/api/warehouses/${warehouseId}/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInventory(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch inventory:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (res.ok) {
        setProducts(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch products:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
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
    fetchWarehouses();
    fetchProducts();
    if (token) fetchFeatures();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchInventory(selectedWarehouse.id);
    }
  }, [selectedWarehouse]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(warehouseForm)
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setWarehouseForm({ name: '', code: '', location: '' });
        fetchWarehouses();
      } else {
        setError(data.error || 'Failed to create warehouse');
      }
    } catch (err) {
      console.error('Failed to create warehouse:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/warehouses/${selectedWarehouse.id}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: stockForm.productId,
          quantity: parseInt(stockForm.quantity) || 0,
          minStockLevel: parseInt(stockForm.minStockLevel) || 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsStockModalOpen(false);
        setStockForm({ productId: '', quantity: '', minStockLevel: '' });
        fetchInventory(selectedWarehouse.id);
      } else {
        setError(data.error || 'Failed to update stock');
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
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
          notes: `Quote request for ${product.name} from Inventory view`
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

  const filteredInventory = inventory.filter(i => 
    i.product?.name.toLowerCase().includes(search.toLowerCase()) || 
    i.product?.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Warehouse Selector */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="flex flex-wrap gap-2">
          {warehouses.map(wh => (
            <button
              key={wh.id}
              onClick={() => setSelectedWarehouse(wh)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                selectedWarehouse?.id === wh.id 
                  ? 'bg-[#141414] text-white shadow-lg' 
                  : 'bg-white border border-[#e5e5e5] text-[#141414] hover:border-[#141414]'
              }`}
            >
              <WarehouseIcon size={16} />
              {wh.name}
              <span className="text-[10px] opacity-50 font-mono">{wh.code}</span>
            </button>
          ))}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-dashed border-[#141414]/30 text-[#141414]/60 hover:border-[#141414] hover:text-[#141414] transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              New Warehouse
            </button>
          )}
        </div>
      </div>

      {selectedWarehouse && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
              <input
                type="text"
                placeholder="Search inventory..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-[#141414] pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <button 
                  onClick={() => setIsStockModalOpen(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#141414] text-[#E4E3E0] text-sm hover:bg-[#141414]/90 transition-colors"
                >
                  <ArrowRightLeft size={16} />
                  Adjust Stock
                </button>
              )}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="border border-[#141414] overflow-hidden min-h-[400px] flex flex-col">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">
                    <th className="p-4 font-medium">SKU</th>
                    <th className="p-4 font-medium">Product Name</th>
                    <th className="p-4 font-medium">Quantity</th>
                    <th className="p-4 font-medium">Min Level</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Last Updated</th>
                    <th className="p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-white transition-colors group">
                      <td className="p-4 text-xs font-mono text-[#141414]/60">{item.product?.sku}</td>
                      <td className="p-4 text-sm font-medium">{item.product?.name}</td>
                      <td className="p-4 text-sm font-mono font-bold">
                        <span className={item.quantity <= item.min_stock_level ? 'text-red-600' : ''}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono opacity-50">{item.min_stock_level}</td>
                      <td className="p-4">
                        {item.quantity <= item.min_stock_level ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-red-600 bg-red-50 px-2 py-1 rounded">
                            <AlertTriangle size={10} />
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono uppercase text-green-600 bg-green-50 px-2 py-1 rounded">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[10px] font-mono opacity-40">
                        {new Date(item.updated_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {isAdmin && (
                            <button 
                              onClick={() => {
                                setStockForm({
                                  productId: item.product_id,
                                  quantity: item.quantity.toString(),
                                  minStockLevel: item.min_stock_level.toString()
                                });
                                setIsStockModalOpen(true);
                              }}
                              className="bg-[#141414] text-white px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                            >
                              <ArrowRightLeft size={12} />
                              Adjust
                            </button>
                          )}
                          {!isAdmin && item.product?.allow_direct_buy && (
                            <button 
                              onClick={() => {
                                if (item.product) {
                                  addToCart(item.product, 1);
                                }
                              }}
                              className="bg-[#141414] text-white px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                            >
                              <ShoppingCart size={12} />
                              Buy
                            </button>
                          )}
                          {!isAdmin && rfqEnabled && (
                            <button 
                              onClick={() => item.product && handleRequestQuote(item.product)}
                              className="border border-[#141414] text-[#141414] px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2"
                            >
                              <FileText size={12} />
                              Quote
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInventory.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <WarehouseIcon size={32} className="opacity-20" />
                  </div>
                  <p className="text-[#141414]/40 italic font-serif text-lg">No inventory items found.</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest opacity-30 mt-2">Products added to this warehouse will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[24px] shadow-xl overflow-hidden">
              <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
                <h2 className="text-xl font-semibold">New Warehouse</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateWarehouse} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle size={14} />
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Name</label>
                  <input type="text" required value={warehouseForm.name} onChange={e => setWarehouseForm({...warehouseForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414]" placeholder="e.g. London DC" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Code</label>
                  <input type="text" required value={warehouseForm.code} onChange={e => setWarehouseForm({...warehouseForm, code: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414]" placeholder="e.g. WH-LON-01" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Location</label>
                  <input type="text" value={warehouseForm.location} onChange={e => setWarehouseForm({...warehouseForm, location: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414]" placeholder="City, Country" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-[#141414] text-white py-3 rounded-xl font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Create Warehouse'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {isStockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsStockModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[24px] shadow-xl overflow-hidden">
              <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
                <h2 className="text-xl font-semibold">Adjust Stock</h2>
                <button onClick={() => setIsStockModalOpen(false)} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateStock} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle size={14} />
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Product</label>
                  <select 
                    required 
                    value={stockForm.productId} 
                    onChange={e => setStockForm({...stockForm, productId: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] bg-white"
                  >
                    <option value="">Select a product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Quantity</label>
                    <input type="number" required value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414]" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Min Stock</label>
                    <input type="number" value={stockForm.minStockLevel} onChange={e => setStockForm({...stockForm, minStockLevel: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414]" placeholder="0" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-[#141414] text-white py-3 rounded-xl font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Update Stock'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
