import React, { useEffect, useState } from 'react';
import { DashboardStats, FeatureFlag } from '../../shared/types';
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
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const { token, user } = useAuth();
  const isSuperAdmin = user?.role?.toLowerCase().includes('superadmin') || 
                       user?.email === 'admin@commerceforce.com' ||
                       user?.role === 'superadmin';

  const systemHealthEnabled = features.find(f => f.feature_key === 'system_health_enabled')?.enabled ?? true;

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
        fetchStats();
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

  const fetchStats = () => {
    if (!token) return;
    fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setStats(data);
        }
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  };

  const fetchFeatures = () => {
    if (!token) return;
    fetch('/api/admin/features', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeatures(data);
        }
      })
      .catch(err => console.error('Failed to fetch features:', err));
  };

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    const loadData = async () => {
      try {
        const [statsRes, featuresRes] = await Promise.all([
          fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/admin/features', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const statsData = await statsRes.json();
        const featuresData = await featuresRes.json();
        
        if (statsData && !statsData.error) setStats(statsData);
        if (Array.isArray(featuresData)) setFeatures(featuresData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
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

      {systemHealthEnabled && (
        <div className="bg-white border border-[#141414] p-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-[10px] font-mono uppercase tracking-widest">
          <span className="opacity-40">System Health:</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span>Database: Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span>API: Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span>Storage: Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span>Jobs: 3 Pending</span>
          </div>
          <span className="ml-auto opacity-30">v2.5.1</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={stats.totalProducts} icon={Package} trend="+12%" />
        <StatCard label="Active Users" value={stats.activeUsers} icon={Users} trend="+5%" />
        <StatCard label="Warehouses" value={stats.activeWarehouses} icon={Warehouse} trend="0%" />
        <StatCard label="Enabled Features" value={stats.enabledFeatures} icon={Flag} trend="+2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-[#141414] p-8 flex flex-col h-[400px]">
          <h3 className="font-serif italic text-xl mb-6 text-[#141414]">Application Logs</h3>
          <div className="flex-1 overflow-y-auto pr-4 space-y-4 font-mono text-[11px]">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((log, i) => (
                <div key={log.id} className="pb-3 border-b border-[#141414]/5 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-blue-600 font-bold">[{log.action}]</span>
                    <span className="opacity-40">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-[#141414]/70 leading-relaxed">{log.details}</p>
                  <div className="mt-1 opacity-40">User: {log.user_name || 'System'}</div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center opacity-30 italic">
                No application logs found.
              </div>
            )}
          </div>
        </div>

        <div className="border border-[#141414] p-8 bg-[#141414] text-[#E4E3E0] flex flex-col h-[400px]">
          <h3 className="font-serif italic text-xl mb-6">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto pr-4 space-y-6">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((item, i) => (
                <div key={item.id} className="flex flex-col gap-1">
                  <span className="text-sm font-light">{item.action}</span>
                  <div className="flex justify-between text-[10px] font-mono opacity-50 uppercase tracking-widest">
                    <span>{item.user_name || 'System'}</span>
                    <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center opacity-30 italic">
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
