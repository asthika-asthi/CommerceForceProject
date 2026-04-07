import React, { useEffect, useState } from 'react';
import { RFQ, Product } from '../shared/types';
import { Search, Plus, Loader2, FileText, CheckCircle2, XCircle, Clock, ArrowRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const CustomerRFQ = () => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'credit'>('prepaid');
  const [couponCode, setCouponCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState<{ isValid: boolean; discount: number; error?: string } | null>(null);
  const { token, user } = useAuth();

  const [newRfq, setNewRfq] = useState({
    items: [{ productId: '', quantity: 1, targetPrice: '' }],
    notes: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rfqRes, prodRes] = await Promise.all([
        fetch('/api/rfq/my', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/products')
      ]);
      const [rfqData, prodData] = await Promise.all([rfqRes.json(), prodRes.json()]);
      setRfqs(Array.isArray(rfqData) ? rfqData : []);
      setProducts(Array.isArray(prodData) ? prodData.filter((p: Product) => p.is_active) : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: newRfq.items.map(item => ({
            ...item,
            targetPrice: item.targetPrice ? parseFloat(item.targetPrice) : undefined
          })),
          notes: newRfq.notes
        })
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewRfq({ items: [{ productId: '', quantity: 1, targetPrice: '' }], notes: '' });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create RFQ:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvert = async () => {
    if (!selectedRfqId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/rfq/${selectedRfqId}/convert`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ paymentMethod, couponCode })
      });
      if (res.ok) {
        setIsConvertModalOpen(false);
        setSelectedRfqId(null);
        setCouponCode('');
        setDiscountInfo(null);
        fetchData();
        alert('Quote converted to order successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to convert RFQ');
      }
    } catch (err) {
      console.error('Failed to convert RFQ:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode) return;
    const rfq = rfqs.find(r => r.id === selectedRfqId);
    if (!rfq) return;

    try {
      const totalQuantity = rfq.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const res = await fetch(`/api/coupons/validate/${couponCode}?amount=${rfq.total_quoted_amount}&quantity=${totalQuantity}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDiscountInfo(data);
    } catch (err) {
      console.error('Failed to validate coupon:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2 py-1 rounded-[4px] text-[10px] font-mono uppercase flex items-center gap-1.5";
    switch (status) {
      case 'pending': return <span className={`${base} bg-amber-50 text-amber-700`}><Clock size={10} /> Pending Review</span>;
      case 'quoted': return <span className={`${base} bg-blue-50 text-blue-700`}><FileText size={10} /> Quote Received</span>;
      case 'accepted': return <span className={`${base} bg-emerald-50 text-emerald-700`}><CheckCircle2 size={10} /> Accepted</span>;
      case 'rejected': return <span className={`${base} bg-rose-50 text-rose-700`}><XCircle size={10} /> Rejected</span>;
      case 'converted': return <span className={`${base} bg-indigo-50 text-indigo-700`}><ShoppingBag size={10} /> Ordered</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request for Quotes</h1>
          <p className="text-sm opacity-50 mt-1 italic font-serif">Bulk pricing and custom quotes for your business needs.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase opacity-40">Available Credit</p>
            <p className="text-lg font-bold text-emerald-600">${user?.available_credit?.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-full text-sm font-medium hover:bg-[#2a2a2a] transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            New Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rfqs.map((rfq) => (
          <motion.div 
            layout
            key={rfq.id}
            className="bg-white border border-[#141414] p-6 rounded-[24px] hover:shadow-lg transition-all group"
          >
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs opacity-40">#{rfq.id.substring(0, 8)}</span>
                  {getStatusBadge(rfq.status)}
                </div>
                <p className="text-sm opacity-60">Requested on {new Date(rfq.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="flex items-center gap-6">
                {rfq.total_quoted_amount && (
                  <div className="text-right">
                    <p className="text-[10px] font-mono uppercase opacity-40">Quoted Total</p>
                    <p className="text-xl font-bold">${rfq.total_quoted_amount.toLocaleString()}</p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {rfq.status === 'quoted' && (
                    <button 
                      onClick={() => {
                        setSelectedRfqId(rfq.id);
                        setDiscountInfo(null);
                        setCouponCode('');
                        setIsConvertModalOpen(true);
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      Accept & Order <ArrowRight size={14} />
                    </button>
                  )}
                  <button className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors">
                    <Plus className="rotate-45" size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {rfqs.length === 0 && !isLoading && (
          <div className="py-20 text-center border-2 border-dashed border-[#141414]/10 rounded-[32px]">
            <FileText size={48} className="mx-auto opacity-10 mb-4" />
            <p className="text-lg font-serif italic opacity-40">No quote requests yet.</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 text-sm font-medium underline underline-offset-4 hover:opacity-60"
            >
              Submit your first request
            </button>
          </div>
        )}
      </div>

      {/* Convert to Order Modal */}
      <AnimatePresence>
        {isConvertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsConvertModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden p-8 border border-[#141414]">
              <h2 className="text-2xl font-bold mb-6">Confirm Order</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest opacity-50 mb-3">Payment Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setPaymentMethod('prepaid')}
                      className={`p-4 rounded-2xl border transition-all text-left ${paymentMethod === 'prepaid' ? 'border-[#141414] bg-[#141414] text-white' : 'border-[#141414]/10 hover:border-[#141414]/30'}`}
                    >
                      <p className="font-bold text-sm">Prepaid</p>
                      <p className="text-[10px] opacity-60">Pay on delivery</p>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('credit')}
                      className={`p-4 rounded-2xl border transition-all text-left ${paymentMethod === 'credit' ? 'border-[#141414] bg-[#141414] text-white' : 'border-[#141414]/10 hover:border-[#141414]/30'}`}
                    >
                      <p className="font-bold text-sm">B2B Credit</p>
                      <p className="text-[10px] opacity-60">Deduct from limit</p>
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    By clicking confirm, you agree to convert this quote into a binding order. 
                    {paymentMethod === 'credit' && ' The total amount will be deducted from your available credit limit.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest opacity-50 mb-3">Discount Code (Optional)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={couponCode}
                      onChange={e => {
                        setCouponCode(e.target.value.toUpperCase());
                        setDiscountInfo(null);
                      }}
                      placeholder="ENTER CODE"
                      className="flex-1 bg-[#f9f9f9] border border-[#141414]/10 px-4 py-2 rounded-xl text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
                    />
                    <button 
                      onClick={validateCoupon}
                      className="px-4 py-2 bg-[#141414] text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
                    >
                      Apply
                    </button>
                  </div>
                  {discountInfo && (
                    <div className={`mt-2 text-[10px] font-mono uppercase ${discountInfo.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {discountInfo.isValid ? `Discount Applied: -$${discountInfo.discount.toLocaleString()}` : discountInfo.error}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsConvertModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-sm border border-[#141414]/10 hover:bg-black/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConvert}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#141414] text-[#E4E3E0] py-4 rounded-2xl font-bold text-sm hover:bg-[#2a2a2a] transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Order'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create RFQ Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-[#E4E3E0] rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#141414]">
              <div className="p-8 border-b border-[#141414]/10 flex items-center justify-between">
                <h2 className="text-2xl font-bold">New Quote Request</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors"><Plus className="rotate-45" size={24} /></button>
              </div>
              
              <form onSubmit={handleCreateRfq} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono uppercase tracking-widest opacity-50">Items to Quote</h3>
                    <button 
                      type="button"
                      onClick={() => setNewRfq({...newRfq, items: [...newRfq.items, { productId: '', quantity: 1, targetPrice: '' }]})}
                      className="text-xs font-medium hover:opacity-60 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                  
                  {newRfq.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white/50 p-4 rounded-2xl border border-[#141414]/5">
                      <div className="md:col-span-6">
                        <label className="block text-[10px] font-mono uppercase opacity-50 mb-1.5">Product</label>
                        <select 
                          required
                          value={item.productId}
                          onChange={e => {
                            const newItems = [...newRfq.items];
                            newItems[idx].productId = e.target.value;
                            setNewRfq({...newRfq, items: newItems});
                          }}
                          className="w-full bg-white border border-[#141414]/20 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-[#141414]"
                        >
                          <option value="">Select a product...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-mono uppercase opacity-50 mb-1.5">Qty</label>
                        <input 
                          type="number" 
                          min="1"
                          required
                          value={item.quantity}
                          onChange={e => {
                            const newItems = [...newRfq.items];
                            newItems[idx].quantity = parseInt(e.target.value);
                            setNewRfq({...newRfq, items: newItems});
                          }}
                          className="w-full bg-white border border-[#141414]/20 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-[#141414]"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-mono uppercase opacity-50 mb-1.5">Target Price (Opt)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.targetPrice}
                          onChange={e => {
                            const newItems = [...newRfq.items];
                            newItems[idx].targetPrice = e.target.value;
                            setNewRfq({...newRfq, items: newItems});
                          }}
                          className="w-full bg-white border border-[#141414]/20 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-[#141414]"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <button 
                          type="button"
                          onClick={() => {
                            const newItems = newRfq.items.filter((_, i) => i !== idx);
                            setNewRfq({...newRfq, items: newItems.length ? newItems : [{ productId: '', quantity: 1, targetPrice: '' }]});
                          }}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Plus className="rotate-45" size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest opacity-50 mb-2">Additional Notes</label>
                  <textarea 
                    value={newRfq.notes}
                    onChange={e => setNewRfq({...newRfq, notes: e.target.value})}
                    className="w-full bg-white border border-[#141414]/20 p-4 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] min-h-[120px]"
                    placeholder="Describe your requirements, shipping needs, or any other details..."
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-2xl font-bold text-lg hover:bg-[#2a2a2a] transition-all flex items-center justify-center gap-3 shadow-xl"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <FileText size={20} />
                        Submit Quote Request
                      </>
                    )}
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
