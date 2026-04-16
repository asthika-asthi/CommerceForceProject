import React, { useEffect, useState } from 'react';
import { LoyaltyPoints, LoyaltyTransaction } from '../../shared/types';
import { Search, Plus, MoreHorizontal, Filter, Loader2, Award, TrendingUp, History, User, ArrowUpRight, ArrowDownRight, Settings2, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { motion, AnimatePresence } from 'motion/react';

export const LoyaltyAdmin = () => {
  const { config: brandingConfig } = useBranding();
  const [stats, setStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const { token } = useAuth();

  const [adjustForm, setAdjustForm] = useState({
    email: '',
    userId: '',
    points: '',
    description: ''
  });
  const [lookupError, setLookupError] = useState('');

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/loyalty/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStats(data);
      } else {
        setStats([]);
      }
    } catch (err) {
      console.error('Failed to fetch loyalty stats:', err);
      setStats([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLookup = async (email: string) => {
    setLookupError('');
    if (!email.includes('@')) return;
    try {
      const res = await fetch(`/api/admin/users/by-email/${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        setAdjustForm(prev => ({ ...prev, userId: user.id, email }));
      } else {
        setLookupError('User not found');
        setAdjustForm(prev => ({ ...prev, userId: '', email }));
      }
    } catch (err) {
      console.error('Lookup failed:', err);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.userId) {
      setLookupError('Please enter a valid customer email first');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/loyalty/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: adjustForm.userId,
          points: parseInt(adjustForm.points),
          description: adjustForm.description
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setAdjustForm({ email: '', userId: '', points: '', description: '' });
        // Add a small delay to ensure DB consistency before refetch
        setTimeout(() => fetchStats(), 500);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to adjust points');
      }
    } catch (err) {
      console.error('Failed to adjust points:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStats = Array.isArray(stats) ? stats.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const totalPoints = Array.isArray(stats) ? stats.reduce((acc, s) => acc + (s.points || 0), 0) : 0;
  const avgBalance = stats.length > 0 ? Math.floor(totalPoints / stats.length) : 0;

  return (
    <div className="space-y-6">
      {/* Configuration Summary Notice */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex gap-4 items-start">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Info size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-900">Program Rules (Active)</p>
          <p className="text-xs text-blue-800/70 mt-1">
            Currently awarding <span className="font-bold">{brandingConfig?.loyalty_points_per_currency || 1} points</span> for every {brandingConfig?.currency_symbol || '1'} spent.
            Redemption value is set to <span className="font-bold font-mono">{brandingConfig?.loyalty_redemption_value || 100} points = {brandingConfig?.currency_symbol || '1'}</span>.
            <button 
              onClick={() => {
                // We'll need a way to navigate to Branding > Loyalty tab
                // For now, redirecting to branding
                window.history.pushState({}, '', '/branding');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="ml-2 font-bold underline hover:text-blue-900 transition-colors"
            >
              Configure Program
            </button>
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-[#141414] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase opacity-50">Total Points Issued</p>
              <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-[#141414] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase opacity-50">Active Participants</p>
              <p className="text-2xl font-bold">{stats.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-[#141414] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase opacity-50">Avg. Balance</p>
              <p className="text-2xl font-bold">{avgBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-[#141414] pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#141414] text-[#E4E3E0] text-sm hover:bg-[#141414]/90 transition-colors"
        >
          <Settings2 size={16} />
          Manual Adjustment
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="border border-[#141414] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium text-right">Points Balance</th>
              <th className="p-4 font-medium">Last Activity</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-12 text-center">
                  <Loader2 className="animate-spin mx-auto opacity-20" size={32} />
                </td>
              </tr>
            ) : filteredStats.map((s, idx) => (
              <tr key={idx} className="hover:bg-white transition-colors group">
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-xs opacity-50">{s.email}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <span className="text-lg font-bold font-mono">{(s.points || 0).toLocaleString()}</span>
                </td>
                <td className="p-4 text-[10px] font-mono opacity-40">
                  {s.updated_at ? new Date(s.updated_at).toLocaleString() : '-'}
                </td>
                <td className="p-4">
                  {(s.points || 0) > 1000 ? (
                    <span className="text-[10px] font-mono uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded">Gold Member</span>
                  ) : (s.points || 0) > 500 ? (
                    <span className="text-[10px] font-mono uppercase text-slate-600 bg-slate-50 px-2 py-1 rounded">Silver Member</span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase text-stone-600 bg-stone-50 px-2 py-1 rounded">Bronze Member</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filteredStats.length === 0 && (
          <div className="p-12 text-center text-[#141414]/40 italic font-serif">
            No loyalty data found.
          </div>
        )}
      </div>

      {/* Adjustment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[24px] shadow-xl overflow-hidden">
              <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
                <h2 className="text-xl font-semibold">Manual Points Adjustment</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"><Plus className="rotate-45" size={20} /></button>
              </div>
              <form onSubmit={handleAdjust} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Customer Email</label>
                  <input 
                    type="email" 
                    required 
                    value={adjustForm.email}
                    placeholder="customer@example.com"
                    className={`w-full px-4 py-2.5 rounded-xl border ${adjustForm.userId ? 'border-green-500' : 'border-[#e5e5e5]'} focus:outline-none focus:ring-2 focus:ring-[#141414]`}
                    onChange={(e) => {
                      const email = e.target.value;
                      setAdjustForm(prev => ({ ...prev, email }));
                      handleLookup(email);
                    }}
                  />
                  {lookupError && <p className="text-[10px] text-red-500 mt-1">{lookupError}</p>}
                  {adjustForm.userId && <p className="text-[10px] text-green-600 mt-1">✓ Customer identified</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Points (Negative to deduct)</label>
                  <input type="number" required value={adjustForm.points} onChange={e => setAdjustForm({...adjustForm, points: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414]" placeholder="e.g. 100 or -50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Reason / Description</label>
                  <textarea required value={adjustForm.description} onChange={e => setAdjustForm({...adjustForm, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] min-h-[100px]" placeholder="e.g. Customer service goodwill" />
                </div>
                <button type="submit" disabled={isSubmitting || !adjustForm.userId} className="w-full bg-[#141414] text-white py-3 rounded-xl font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Apply Adjustment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
