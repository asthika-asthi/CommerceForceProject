import React, { useEffect, useState } from 'react';
import { Coupon } from '../../shared/types';
import { Search, Plus, Loader2, Ticket, Calendar, Percent, DollarSign, Trash2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

import { useBranding } from '../../context/BrandingContext';

export const CouponsAdmin = () => {
  const { config: brandingConfig } = useBranding();
  const currency = brandingConfig?.currency_symbol || '£';
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    min_order_amount: 0,
    min_quantity: 0,
    max_discount_amount: undefined as number | undefined,
    expiry_date: '',
    usage_limit: undefined as number | undefined,
    is_loyalty_only: false,
    is_active: true
  });

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/coupons', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCoupon)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingCoupon(null);
        setNewCoupon({
          code: '',
          type: 'percentage',
          value: 0,
          min_order_amount: 0,
          min_quantity: 0,
          max_discount_amount: undefined,
          expiry_date: '',
          usage_limit: undefined,
          is_loyalty_only: false,
          is_active: true
        });
        fetchCoupons();
      }
    } catch (err) {
      console.error('Failed to save coupon:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setNewCoupon({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order_amount: coupon.min_order_amount,
      min_quantity: coupon.min_quantity || 0,
      max_discount_amount: coupon.max_discount_amount,
      expiry_date: coupon.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : '',
      usage_limit: coupon.usage_limit,
      is_loyalty_only: coupon.is_loyalty_only,
      is_active: coupon.is_active
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setNewCoupon({
      code: '',
      type: 'percentage',
      value: 0,
      min_order_amount: 0,
      min_quantity: 0,
      max_discount_amount: undefined,
      expiry_date: '',
      usage_limit: undefined,
      is_loyalty_only: false,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchCoupons();
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Marketing & Promotions</h1>
        <button 
          onClick={openCreateModal}
          className="bg-[#141414] text-[#E4E3E0] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Create Coupon
        </button>
      </div>

      <div className="border border-[#141414] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Value</th>
              <th className="p-4 font-medium">Min Order</th>
              <th className="p-4 font-medium">Min Qty</th>
              <th className="p-4 font-medium">Usage</th>
              <th className="p-4 font-medium">Expiry</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-white transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Ticket size={14} className="opacity-30" />
                    <div className="flex flex-col">
                      <span className="text-sm font-mono font-bold">{coupon.code}</span>
                      {coupon.is_loyalty_only && (
                        <span className="text-[8px] font-mono uppercase tracking-widest text-amber-600 bg-amber-50 px-1 rounded w-fit">Loyalty Only</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-xs uppercase font-mono opacity-60">{coupon.type}</span>
                </td>
                <td className="p-4">
                  <span className="text-sm font-medium">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `${currency}${coupon.value}`}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-sm font-medium">{currency}{coupon.min_order_amount}</span>
                </td>
                <td className="p-4">
                  <span className="text-sm font-medium">{coupon.min_quantity || 0}</span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm">{coupon.used_count} / {coupon.usage_limit || '∞'}</span>
                    <div className="w-24 h-1 bg-[#141414]/5 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-[#141414]" 
                        style={{ width: coupon.usage_limit ? `${(coupon.used_count / coupon.usage_limit) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-4 text-xs opacity-60">
                  {coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'Never'}
                </td>
                <td className="p-4">
                  {coupon.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      <XCircle size={10} /> Inactive
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleEdit(coupon)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#141414] hover:bg-[#141414]/5 rounded-lg transition-colors border border-[#141414]/10"
                    >
                      <RefreshCw size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(coupon.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && !isLoading && (
          <div className="p-12 text-center text-[#141414]/40 italic font-serif">
            No coupons created yet.
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[24px] shadow-xl overflow-hidden">
              <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editingCoupon ? 'Edit Promotion' : 'Create Promotion'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors">
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={editingCoupon ? "col-span-1" : "col-span-2"}>
                    <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Coupon Code</label>
                    <input
                      required
                      type="text"
                      placeholder="SUMMER2024"
                      value={newCoupon.code}
                      onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                      className="w-full bg-[#f9f9f9] border border-[#f0f0f0] px-4 py-2 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
                    />
                  </div>
                  {editingCoupon && (
                    <div>
                      <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Status</label>
                      <select
                        value={newCoupon.is_active ? 'active' : 'inactive'}
                        onChange={e => setNewCoupon({...newCoupon, is_active: e.target.value === 'active'})}
                        className="w-full bg-[#f9f9f9] border border-[#f0f0f0] px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Type</label>
                    <select
                      value={newCoupon.type}
                      onChange={e => setNewCoupon({...newCoupon, type: e.target.value as 'percentage' | 'fixed'})}
                      className="w-full bg-[#f9f9f9] border border-[#f0f0f0] px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ({currency})</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Value</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 flex items-center justify-center w-4 h-4">
                        {newCoupon.type === 'percentage' ? <Percent size={14} /> : <span className="text-sm font-bold">{currency}</span>}
                      </div>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={newCoupon.value}
                        onChange={e => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})}
                        className="w-full bg-[#f9f9f9] border border-[#f0f0f0] pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Min Order Amount</label>
                    <input
                      type="number"
                      value={newCoupon.min_order_amount}
                      onChange={e => setNewCoupon({...newCoupon, min_order_amount: parseFloat(e.target.value)})}
                      className="w-full bg-[#f9f9f9] border border-[#f0f0f0] px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Min Quantity</label>
                    <input
                      type="number"
                      value={newCoupon.min_quantity}
                      onChange={e => setNewCoupon({...newCoupon, min_quantity: parseInt(e.target.value)})}
                      className="w-full bg-[#f9f9f9] border border-[#f0f0f0] px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Max Discount (Opt)</label>
                    <input
                      type="number"
                      value={newCoupon.max_discount_amount || ''}
                      onChange={e => setNewCoupon({...newCoupon, max_discount_amount: e.target.value ? parseFloat(e.target.value) : undefined})}
                      className="w-full bg-[#f9f9f9] border border-[#f0f0f0] px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Expiry Date (Opt)</label>
                    <input
                      type="date"
                      value={newCoupon.expiry_date}
                      onChange={e => setNewCoupon({...newCoupon, expiry_date: e.target.value})}
                      className="w-full bg-[#f9f9f9] border border-[#f0f0f0] px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase opacity-40 mb-1">Usage Limit (Opt)</label>
                    <input
                      type="number"
                      value={newCoupon.usage_limit || ''}
                      onChange={e => setNewCoupon({...newCoupon, usage_limit: e.target.value ? parseInt(e.target.value) : undefined})}
                      className="w-full bg-[#f9f9f9] border border-[#f0f0f0] px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <input
                      type="checkbox"
                      id="is_loyalty_only"
                      checked={newCoupon.is_loyalty_only}
                      onChange={e => setNewCoupon({...newCoupon, is_loyalty_only: e.target.checked})}
                      className="w-4 h-4 rounded border-[#141414]/20 text-[#141414] focus:ring-[#141414]"
                    />
                    <label htmlFor="is_loyalty_only" className="text-xs font-medium text-amber-900 cursor-pointer">
                      Restrict to Loyalty Customers Only
                    </label>
                  </div>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#141414] text-white py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingCoupon ? 'Update Promotion' : 'Create Promotion')}
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
