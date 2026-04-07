import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../../shared/types';
import { Search, MoreHorizontal, Filter, Loader2, Package, User, Calendar, MapPin, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const fetchOrders = () => {
    setIsLoading(true);
    fetch('/api/orders', {
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

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          const updatedOrder = await response.json();
          setSelectedOrder(updatedOrder);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

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
    o.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: OrderStatus) => {
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
          <input
            type="text"
            placeholder="Search by Order ID or Customer..."
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
        </div>
      </div>

      <div className="border border-[#141414] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">
              <th className="p-4 font-medium">Order ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-[#141414]" size={24} />
                </td>
              </tr>
            ) : filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-white transition-colors group cursor-pointer" onClick={() => viewOrderDetails(order.id)}>
                <td className="p-4 text-xs font-mono text-[#141414]/60">#{order.id.substring(0, 8)}</td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{order.user?.name}</span>
                    <span className="text-[10px] text-[#141414]/50">{order.user?.email}</span>
                  </div>
                </td>
                <td className="p-4 text-xs text-[#141414]/60">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-sm font-mono font-bold">£{order.total_amount.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filteredOrders.length === 0 && (
          <div className="p-12 text-center text-[#141414]/40 italic font-serif">
            No orders found.
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {isDetailsOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between bg-[#141414] text-white">
                <div>
                  <h2 className="text-xl font-semibold">Order Details</h2>
                  <p className="text-xs opacity-60 font-mono mt-1">ID: {selectedOrder.id}</p>
                </div>
                <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Status and Actions */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start border-b border-[#f0f0f0] pb-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Current Status</span>
                    <div className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </div>
                  </div>
                  <div className="space-y-2 w-full md:w-auto">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Update Status</span>
                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(selectedOrder.id, status)}
                          disabled={selectedOrder.status === status}
                          className={`px-3 py-1 text-[10px] uppercase tracking-widest border border-[#141414] transition-all ${
                            selectedOrder.status === status 
                              ? 'bg-[#141414] text-white opacity-50 cursor-not-allowed' 
                              : 'hover:bg-[#141414] hover:text-white'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] flex items-center justify-center">
                        <User size={16} className="text-[#141414]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">Customer</p>
                        <p className="text-sm font-medium">{selectedOrder.user?.name}</p>
                        <p className="text-xs text-[#141414]/60">{selectedOrder.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] flex items-center justify-center">
                        <Calendar size={16} className="text-[#141414]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">Order Date</p>
                        <p className="text-sm font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] flex items-center justify-center mt-1">
                        <MapPin size={16} className="text-[#141414]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">Shipping Address</p>
                        <p className="text-sm font-medium leading-relaxed">{selectedOrder.shipping_address || 'No address provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-[#141414]" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Order Items</h3>
                  </div>
                  <div className="border border-[#141414] rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f5f5f5] text-[10px] font-mono uppercase tracking-widest border-b border-[#141414]">
                          <th className="p-3 font-medium">Product</th>
                          <th className="p-3 font-medium text-center">Qty</th>
                          <th className="p-3 font-medium text-right">Price</th>
                          <th className="p-3 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f0f0]">
                        {selectedOrder.items?.map((item) => (
                          <tr key={item.id} className="text-sm">
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{item.product?.name}</span>
                                <span className="text-[10px] font-mono opacity-50">{item.product?.sku}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono">{item.quantity}</td>
                            <td className="p-3 text-right font-mono">£{item.unit_price.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono font-bold">£{item.total_price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#f5f5f5] font-bold">
                          <td colSpan={3} className="p-3 text-right text-[10px] font-mono uppercase tracking-widest">Grand Total</td>
                          <td className="p-3 text-right font-mono text-lg">£{selectedOrder.total_amount.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
