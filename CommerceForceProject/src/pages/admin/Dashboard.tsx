import React, { useEffect, useState } from 'react';
import { DashboardStats } from '../../shared/types';
import { ArrowUpRight, Package, Users, Warehouse, Flag } from 'lucide-react';

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

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(setStats);
  }, []);

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={stats.totalProducts} icon={Package} trend="+12%" />
        <StatCard label="Active Users" value={stats.activeUsers} icon={Users} trend="+5%" />
        <StatCard label="Warehouses" value={stats.activeWarehouses} icon={Warehouse} trend="0%" />
        <StatCard label="Enabled Features" value={stats.enabledFeatures} icon={Flag} trend="+2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-[#141414] p-8">
          <h3 className="font-serif italic text-xl mb-6 text-[#141414]">System Health</h3>
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
