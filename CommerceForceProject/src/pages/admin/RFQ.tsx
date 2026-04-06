import React, { useEffect, useState } from 'react';
import { RFQ, RFQItem } from '../../shared/types';
import { Search, Plus, MoreHorizontal, Filter, Loader2, FileText, CheckCircle2, XCircle, Clock, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const RFQAdmin = () => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState<{ id: string, quotedPrice: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();

  const fetchRfqs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rfq', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRfqs(data);
    } catch (err) {
      console.error('Failed to fetch RFQs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const handleOpenQuote = async (rfq: RFQ) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/rfq/${rfq.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedRfq(data);
      setQuoteForm(data.items.map((item: RFQItem) => ({
        id: item.id,
        quotedPrice: item.quoted_price || 0
      })));
      setIsQuoteModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch RFQ details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/rfq/${selectedRfq.id}/quote`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: quoteForm })
      });
      if (res.ok) {
        setIsQuoteModalOpen(false);
        fetchRfqs();
      }
    } catch (err) {
      console.error('Failed to submit quote:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      case 'quoted': return <FileText size={16} className="text-blue-500" />;
      case 'accepted': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'rejected': return <XCircle size={16} className="text-rose-500" />;
      case 'converted': return <ArrowRight size={16} className="text-indigo-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">B2B RFQ Management</h1>
      </div>

      <div className="border border-[#141414] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">
              <th className="p-4 font-medium">RFQ ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Quoted Amount</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]">
            {rfqs.map((rfq) => (
              <tr key={rfq.id} className="hover:bg-white transition-colors group">
                <td className="p-4 font-mono text-xs">{rfq.id.substring(0, 8)}</td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{rfq.user?.name}</span>
                    <span className="text-[10px] opacity-50">{rfq.user?.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(rfq.status)}
                    <span className="text-[10px] font-mono uppercase">{rfq.status}</span>
                  </div>
                </td>
                <td className="p-4 text-right font-mono">
                  {rfq.total_quoted_amount ? `$${rfq.total_quoted_amount.toLocaleString()}` : '-'}
                </td>
                <td className="p-4 text-[10px] font-mono opacity-40">
                  {new Date(rfq.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleOpenQuote(rfq)}
                    className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors inline-flex items-center gap-2 text-xs font-medium"
                  >
                    {rfq.status === 'pending' ? 'Review & Quote' : 'View Details'}
                    <ExternalLink size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rfqs.length === 0 && !isLoading && (
          <div className="p-12 text-center text-[#141414]/40 italic font-serif">
            No RFQs found.
          </div>
        )}
      </div>

      {/* Quote Modal */}
      <AnimatePresence>
        {isQuoteModalOpen && selectedRfq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsQuoteModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">RFQ Details: {selectedRfq.id.substring(0, 8)}</h2>
                  <p className="text-xs opacity-50">Customer: {selectedRfq.user?.name} ({selectedRfq.user?.email})</p>
                </div>
                <button onClick={() => setIsQuoteModalOpen(false)} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"><Plus className="rotate-45" size={20} /></button>
              </div>
              
              <form onSubmit={handleQuoteSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedRfq.notes && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <p className="text-xs font-semibold uppercase text-amber-800 mb-1">Customer Notes</p>
                    <p className="text-sm text-amber-900">{selectedRfq.notes}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest opacity-50">Requested Items</h3>
                  {selectedRfq.items?.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border border-[#f0f0f0] rounded-2xl">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product?.name}</p>
                        <p className="text-[10px] font-mono opacity-50">SKU: {item.product?.sku} | Qty: {item.quantity}</p>
                        {item.target_price && (
                          <p className="text-[10px] text-indigo-600 font-mono mt-1">Target Price: ${item.target_price}</p>
                        )}
                      </div>
                      <div className="w-32">
                        <label className="block text-[10px] font-mono uppercase opacity-50 mb-1">Quote Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-50">$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            required
                            disabled={selectedRfq.status !== 'pending'}
                            value={quoteForm.find(f => f.id === item.id)?.quotedPrice || ''}
                            onChange={e => {
                              const newForm = [...quoteForm];
                              const index = newForm.findIndex(f => f.id === item.id);
                              newForm[index].quotedPrice = parseFloat(e.target.value);
                              setQuoteForm(newForm);
                            }}
                            className="w-full pl-6 pr-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#141414]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedRfq.status === 'pending' && (
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 bg-[#141414] text-white py-3 rounded-xl font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Send Quote'}
                    </button>
                    <button 
                      type="button"
                      onClick={async () => {
                        if (confirm('Are you sure you want to reject this RFQ?')) {
                          await fetch(`/api/rfq/${selectedRfq.id}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ status: 'rejected' })
                          });
                          setIsQuoteModalOpen(false);
                          fetchRfqs();
                        }
                      }}
                      className="px-6 py-3 border border-rose-200 text-rose-600 rounded-xl font-medium hover:bg-rose-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
