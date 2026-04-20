import React, { useEffect, useState } from 'react';
import { Order } from '../shared/types';
import { useBranding } from '../context/BrandingContext';
import { Search, Loader2, Package, Calendar, MapPin, ChevronRight, X, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const MyOrders = () => {
  const { config: brandingConfig } = useBranding();
  const currency = brandingConfig?.currency_symbol || '£';
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const fetchOrders = () => {
    setIsLoading(true);
    fetch('/api/orders/my', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch orders:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const viewOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
        setIsDetailsOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    o.status.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#141414]">MyOrders</h1>
          <p className="text-sm text-[#141414]/50 mt-1">Track and manage your order history</p>
        </div>
        <div className="relative w-full md:w-80 shadow-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-black/5 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-black/5 rounded-[32px] overflow-hidden shadow-sm min-h-[400px] flex flex-col">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fcfcfc] text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#141414]/40 border-b border-black/5">
              <th className="p-6">Order</th>
              <th className="p-6">Date</th>
              <th className="p-6">Total</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-[#141414]/40">
                  <Loader2 className="animate-spin mx-auto mb-4" size={24} />
                  <span className="text-xs font-mono uppercase tracking-widest">Loading orders...</span>
                </td>
              </tr>
            ) : filteredOrders.map((order) => (
              <tr 
                key={order.id} 
                className="hover:bg-black/[0.02] transition-colors group cursor-pointer" 
                onClick={() => viewOrderDetails(order.id)}
              >
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#141414]">#{order.id.substring(0, 8)}</span>
                    <span className="text-[10px] font-mono text-[#141414]/30 uppercase tracking-widest mt-0.5">Reference ID</span>
                  </div>
                </td>
                <td className="p-6 text-sm text-[#141414]/60 font-medium">
                  {new Date(order.created_at).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </td>
                <td className="p-6 text-sm font-mono font-bold text-[#141414]">
                  {currency}{order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-6">
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full font-bold shadow-sm ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-6 text-right">
                  <button className="p-2 hover:bg-white rounded-xl transition-all shadow-sm group-hover:shadow-md border border-transparent group-hover:border-black/5">
                    <ChevronRight size={18} className="text-[#141414]/40 group-hover:text-[#141414]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filteredOrders.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center mb-6 shadow-inner">
              <Package size={40} className="text-[#141414]/10" />
            </div>
            <p className="text-2xl font-bold text-[#141414] mb-2">No orders found</p>
            <p className="text-sm text-[#141414]/40 max-w-xs mx-auto leading-relaxed">
              When you place an order, it will appear here for you to track and manage.
            </p>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/products');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="mt-8 px-6 py-3 bg-[#141414] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
            >
              Explore Products
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isDetailsOpen && selectedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-black/5"
            >
              <div className="p-8 border-b border-black/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#141414]">Order Details</h2>
                  <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-[#141414]/40 uppercase tracking-widest">
                    <span>ID: {selectedOrder.id}</span>
                    <span className="w-1 h-1 rounded-full bg-black/10" />
                    <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailsOpen(false)} 
                  className="p-3 bg-black/5 hover:bg-black/10 rounded-2xl transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <div className="flex flex-col md:flex-row gap-12 bg-black/[0.02] p-8 rounded-[32px] border border-black/5">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 opacity-40">
                      <ShoppingBag size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Shipping Status</span>
                    </div>
                    <div className="space-y-4">
                      <div className={`inline-flex px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </div>
                      <p className="text-xs text-[#141414]/50 leading-relaxed">
                        Your order is currently being {selectedOrder.status === 'delivered' ? 'archived as delivered' : selectedOrder.status}. 
                        We will notify you of any changes.
                      </p>
                    </div>
                  </div>
                  <div className="h-px md:h-24 w-full md:w-px bg-black/5" />
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 opacity-40">
                      <MapPin size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Delivery Address</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-[#141414]">
                      {selectedOrder.shipping_address || 'No address provided'}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Order Items</h3>
                    <span className="text-[10px] font-mono font-bold bg-black/5 px-2 py-1 rounded-lg">
                      {selectedOrder.items?.length || 0} Products
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-black/[0.03] rounded-2xl hover:border-black/10 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center">
                            <Package size={20} className="text-[#141414]/20" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#141414]">{item.product?.name}</p>
                            <p className="text-[10px] font-mono text-[#141414]/30 uppercase tracking-widest mt-0.5">
                              {item.product?.sku} • Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold text-[#141414]">
                            {currency}{item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] font-mono text-[#141414]/30">
                            {currency}{item.unit_price.toLocaleString()} ea
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[#141414] text-white flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 font-bold mb-1">Total Paid</span>
                  <p className="text-3xl font-mono font-bold">
                    {currency}{selectedOrder.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <button 
                  onClick={() => setIsDetailsOpen(false)}
                  className="w-full md:w-auto px-10 py-4 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-xl"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
