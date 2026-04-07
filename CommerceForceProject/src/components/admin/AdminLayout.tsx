import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Flag, Package, Users, Menu, X, LogOut, ShoppingCart, Warehouse as WarehouseIcon, Award, FileText, Mail, Ticket, AlertTriangle, ShoppingBag, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { CartModal } from '../CartModal';
import { FeatureFlag } from '../../shared/types';

interface NavItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
  key?: React.Key;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
      active 
        ? 'bg-[#141414] text-[#E4E3E0]' 
        : 'text-[#141414]/60 hover:text-[#141414] hover:bg-black/5'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdminLayout = ({ children, activeTab, setActiveTab }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const { user, logout, token } = useAuth();
  const { totalItems } = useCart();

  const b2bEnabled = features.find(f => f.feature_key === 'b2b_enabled')?.enabled ?? true;
  const rfqEnabled = features.find(f => f.feature_key === 'rfq_enabled')?.enabled ?? true;
  const loyaltyEnabled = features.find(f => f.feature_key === 'loyalty_program')?.enabled ?? true;

  useEffect(() => {
    if (token) {
      fetch('/api/admin/features', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFeatures(data);
          } else {
            setFeatures([]);
          }
        })
        .catch(err => {
          console.error('Failed to fetch features:', err);
          setFeatures([]);
        });

      if (user?.role === 'customer') {
        fetch('/api/loyalty/points', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => setLoyaltyPoints(data.points || 0))
          .catch(err => console.error('Failed to fetch loyalty points:', err));
      }
    }
  }, [token, user?.role]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'superadmin', 'client'] },
    { id: 'branding', label: 'Branding', icon: Settings, roles: ['superadmin'] },
    { id: 'features', label: 'Feature Flags', icon: Flag, roles: ['superadmin'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['admin', 'superadmin', 'client', 'customer'] },
    { id: 'inventory', label: 'Inventory', icon: WarehouseIcon, roles: ['admin', 'superadmin', 'client'], feature: 'b2b_enabled' },
    { id: 'inventory-alerts', label: 'Inventory Alerts', icon: AlertTriangle, roles: ['admin', 'superadmin', 'client'], feature: 'b2b_enabled' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'superadmin', 'client'] },
    { id: 'rfq', label: 'RFQs', icon: FileText, roles: ['admin', 'superadmin', 'client'], feature: 'rfq_enabled' },
    { id: 'loyalty', label: 'Loyalty', icon: Award, roles: ['admin', 'superadmin', 'client'], feature: 'loyalty_program' },
    { id: 'coupons', label: 'Promotions', icon: Ticket, roles: ['admin', 'superadmin', 'client'] },
    { id: 'email', label: 'Email Logs', icon: Mail, roles: ['superadmin'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['superadmin'] },
  ];

  const customerNavItems = [
    { id: 'customer-rfq', label: 'My RFQs', icon: FileText, path: '/rfq', roles: ['customer', 'admin', 'superadmin', 'client'], feature: 'rfq_enabled' },
  ];

  const filteredNavItems = navItems.filter(item => {
    const hasRole = item.roles.includes(user?.role || '');
    const featureFlag = features.find(f => f.feature_key === item.feature);
    const isFeatureEnabled = item.feature ? (featureFlag?.enabled ?? true) : true;
    return hasRole && isFeatureEnabled;
  });

  const filteredCustomerNavItems = customerNavItems.filter(item => {
    const hasRole = item.roles.includes(user?.role || '');
    const featureFlag = features.find(f => f.feature_key === item.feature);
    const isFeatureEnabled = item.feature ? (featureFlag?.enabled ?? true) : true;
    return hasRole && isFeatureEnabled;
  });

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } border-r border-[#141414] transition-all duration-300 flex flex-col bg-[#E4E3E0]`}
      >
        <div className="p-6 border-b border-[#141414] flex items-center justify-between">
          {isSidebarOpen && (
            <span className="font-serif italic font-bold text-xl tracking-tight text-[#141414]">
              CommerceForce
            </span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-black/5 rounded"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {filteredNavItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={isSidebarOpen ? item.label : ''}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}

          {isSidebarOpen && filteredCustomerNavItems.length > 0 && (
            <div className="mt-8 mb-2 px-4">
              <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Customer Portal</p>
            </div>
          )}
          
          {filteredCustomerNavItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={isSidebarOpen ? item.label : ''}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-[#141414]">
          <div className="flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center text-[#E4E3E0] text-xs font-bold">
                {user?.name?.substring(0, 2).toUpperCase() || 'CF'}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#141414] truncate max-w-[100px]">{user?.name}</span>
                  <span className="text-[10px] text-[#141414]/50 uppercase tracking-wider">{user?.role}</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button 
                onClick={logout}
                className="p-1.5 hover:bg-black/5 rounded-lg text-[#141414]/60 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#141414] flex items-center justify-between px-8 bg-[#E4E3E0]">
          <h1 className="font-serif italic text-lg text-[#141414]">
            {[...navItems, ...customerNavItems].find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-4">
            {user?.role === 'customer' && loyaltyEnabled && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                <Coins size={14} />
                <span className="text-xs font-bold font-mono">{loyaltyPoints} pts</span>
              </div>
            )}
            {user?.role === 'customer' && (
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-black/5 rounded-full transition-colors group"
              >
                <ShoppingBag size={20} className="text-[#141414]" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#E4E3E0] animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">
              v2.5.0-stable
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {isCartOpen && (
          <CartModal 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)} 
            onCheckout={() => setActiveTab('checkout')}
            onViewCart={() => {
              setIsCartOpen(false);
              setActiveTab('cart');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
