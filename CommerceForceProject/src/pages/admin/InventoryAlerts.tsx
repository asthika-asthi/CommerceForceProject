import React, { useEffect, useState } from 'react';
import { Search, Loader2, AlertTriangle, CheckCircle2, Warehouse as WarehouseIcon, Package, Calendar, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryAlert {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  min_stock_level: number;
  status: 'unread' | 'read' | 'resolved';
  created_at: string;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
}

export const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { token } = useAuth();

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/warehouses/inventory/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch inventory alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/warehouses/inventory/alerts/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'read' } : a));
      }
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inventory Alerts</h1>
          <p className="text-sm text-[#141414]/60">Monitor low stock levels across all warehouses</p>
        </div>
        <div className="flex items-center gap-2 bg-[#f5f5f5] p-1 rounded-lg">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === f ? 'bg-white shadow-sm text-[#141414]' : 'text-[#141414]/40 hover:text-[#141414]/60'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin opacity-20" size={32} />
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.map((alert) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={alert.id}
                className={`group relative bg-white border rounded-[24px] p-6 transition-all hover:shadow-md ${
                  alert.status === 'unread' ? 'border-rose-200 bg-rose-50/30' : 'border-[#f0f0f0]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${
                      alert.status === 'unread' ? 'bg-rose-100 text-rose-600' : 'bg-[#f5f5f5] text-[#141414]/40'
                    }`}>
                      <AlertTriangle size={24} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#141414]">{alert.product_name}</h3>
                        <span className="text-[10px] font-mono bg-[#141414]/5 px-2 py-0.5 rounded uppercase opacity-60">
                          {alert.product_sku}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#141414]/60">
                        <div className="flex items-center gap-1.5">
                          <WarehouseIcon size={14} />
                          {alert.warehouse_name}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {new Date(alert.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 text-right">
                    <div className="space-y-0.5">
                      <div className="text-2xl font-bold text-rose-600 leading-none">
                        {alert.quantity}
                      </div>
                      <div className="text-[10px] font-mono uppercase opacity-40">
                        Current Stock (Min: {alert.min_stock_level})
                      </div>
                    </div>
                    {alert.status === 'unread' && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="text-[10px] font-mono uppercase tracking-widest text-[#141414] hover:underline"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 bg-[#f9f9f9] border border-dashed border-[#141414]/10 rounded-[32px] text-center p-8">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="font-bold text-[#141414] mb-1">All Clear</h3>
              <p className="text-sm text-[#141414]/40 max-w-xs">
                No low stock alerts found. Your inventory levels are looking healthy.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
