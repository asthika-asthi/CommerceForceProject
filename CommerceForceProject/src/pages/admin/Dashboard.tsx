import React, { useEffect, useState } from 'react';
import { DashboardStats } from '../../shared/types';
import { ArrowUpRight, Package, Users, Warehouse, Flag, Loader2, Database, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ label, value, icon: Icon, trend }: any) => (
  <div className="border border-[#141414] p-6 bg-white/50 hover:bg-white transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-[#141414] text-[#E4E3E0]">
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-mono text-green-600 flex items-center gap-1">
        {trend} <ArrowUpRight size={12} />
      </span>
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-light tracking-tight text-[#141414] mb-1">
        {value}
      </span>
      <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">
        {label}
      </span>
    </div>
  </div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const { token, user } = useAuth();
  const isSuperAdmin = user?.role?.toLowerCase().includes('superadmin') || 
                       user?.email === 'admin@commerceforce.com' ||
                       user?.role === 'superadmin';

  const handleSeed = async () => {
    if (!token) return;
    setIsSeeding(true);
    setSeedMessage('');
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSeedMessage(data.message);
        // Refresh stats
        const statsRes = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setSeedMessage(data.error || 'Failed to seed data');
      }
    } catch (err) {
      setSeedMessage('Error seeding data');
    } finally {
      setIsSeeding(false);
      setTimeout(() => setSeedMessage(''), 5000);
    }
  };

  useEffect(() => {
    if (!token) return;

    setIsLoading(true);
    fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setStats(data);
        }
      })
      .catch(err => console.error('Failed to fetch stats:', err))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#141414]/40">
        <Loader2 size={48} className="mb-4 animate-spin opacity-20" />
        <p className="text-sm font-mono uppercase tracking-widest">Loading stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#141414]/40">
        <Package size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-mono uppercase tracking-widest">Unable to load dashboard stats</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isSuperAdmin && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-[#141414] p-6 gap-4">
          <div>
            <h3 className="font-serif italic text-lg text-[#141414]">Demo Environment</h3>
            <p className="text-xs text-[#141414]/60">Initialize the system with sample users, warehouses, and inventory.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            {seedMessage && (
              <span className="text-xs font-mono text-green-600 flex items-center gap-1 animate-pulse">
                <CheckCircle2 size={14} /> {seedMessage}
              </span>
            )}
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#141414] text-[#E4E3E0] text-xs font-mono uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              {isSeeding ? <Loader2 className="animate-spin" size={14} /> : <Database size={14} />}
              {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={stats.totalProducts} icon={Package} trend="+12%" />
        <StatCard label="Active Users" value={stats.activeUsers} icon={Users} trend="+5%" />
        <StatCard label="Warehouses" value={stats.activeWarehouses} icon={Warehouse} trend="0%" />
        <StatCard label="Enabled Features" value={stats.enabledFeatures} icon={Flag} trend="+2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-[#141414] p-8">
          <h3 className="font-serif italic text-xl mb-6 text-[#141414]">System Health <span className="text-[10px] font-mono opacity-30">(v2.5.1)</span></h3>
          <div className="space-y-4">
            {[
              { label: 'Database Connection', status: 'Optimal', color: 'text-green-600' },
              { label: 'API Gateway', status: 'Active', color: 'text-green-600' },
              { label: 'Media Storage', status: 'Connected', color: 'text-green-600' },
              { label: 'Scheduled Jobs', status: '3 Pending', color: 'text-amber-600' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-[#141414]/10">
                <span className="text-sm text-[#141414]/70">{item.label}</span>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${item.color}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#141414] p-8 bg-[#141414] text-[#E4E3E0]">
          <h3 className="font-serif italic text-xl mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[
              { action: 'Product SKU Updated', user: 'Sarah Mitchell', time: '2m ago' },
              { action: 'New B2B Account Approved', user: 'Sarah Mitchell', time: '15m ago' },
              { action: 'Feature Flag: RFQ Enabled', user: 'System', time: '1h ago' },
              { action: 'Inventory Sync Completed', user: 'James Carter', time: '3h ago' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-sm font-light">{item.action}</span>
                <div className="flex justify-between text-[10px] font-mono opacity-50 uppercase tracking-widest">
                  <span>{item.user}</span>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
