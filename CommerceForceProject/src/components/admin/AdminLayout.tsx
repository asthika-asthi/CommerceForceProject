import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Flag, Package, Users, Menu, X, LogOut, ShoppingCart, Warehouse as WarehouseIcon, Award, FileText, Mail, Ticket, AlertTriangle, ShoppingBag, Coins, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useBranding } from '../../context/BrandingContext';
import { CartModal } from '../CartModal';
import { Footer } from '../Footer';
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
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20 rounded-xl' 
        : 'text-[#141414]/60 hover:text-[#141414] hover:bg-black/5 rounded-xl'
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
  const { config } = useBranding();

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
    { id: 'landing', label: 'Home', icon: ShoppingBag, roles: ['customer', 'admin', 'superadmin', 'client'] },
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
    { id: 'contact', label: 'Contact Us', icon: MessageSquare, roles: ['customer', 'admin', 'superadmin', 'client'], enabled: config?.contact_page_enabled },
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
    const isExplicitlyEnabled = item.enabled !== undefined ? item.enabled : true;
    return hasRole && isFeatureEnabled && isExplicitlyEnabled;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-[var(--font-family)]">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-24'
        } border-r border-black/5 transition-all duration-300 flex flex-col bg-white shadow-xl z-20`}
      >
        <div className="p-8 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              {config?.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-color)] flex items-center justify-center text-white font-bold">
                  {config?.company_name?.charAt(0) || 'C'}
                </div>
              )}
              <span className="font-bold text-lg tracking-tight text-[#141414] truncate max-w-[140px]">
                {config?.company_name || 'CommerceForce'}
              </span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-black/5 rounded-xl transition-colors"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
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
            <div className="mt-10 mb-4 px-4">
              <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest font-bold">Customer Portal</p>
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

        <div className="p-6 border-t border-black/5">
          <div className="flex items-center justify-between gap-3 bg-black/5 p-3 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-[var(--primary-color)]/20">
                {user?.name?.substring(0, 2).toUpperCase() || 'CF'}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-[#141414] truncate">{user?.name}</span>
                  <span className="text-[10px] text-[#141414]/50 uppercase tracking-wider font-bold">{user?.role}</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button 
                onClick={logout}
                className="p-2 hover:bg-white rounded-xl text-[#141414]/60 hover:text-red-600 transition-all shadow-sm"
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
        <header className="h-20 border-b border-black/5 flex items-center justify-between px-10 bg-white/80 backdrop-blur-md z-10">
          <h1 className="font-bold text-xl text-[#141414] tracking-tight">
            {[...navItems, ...customerNavItems].find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-6">
            {user?.role === 'customer' && loyaltyEnabled && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shadow-sm">
                <Award size={16} />
                <span className="text-xs font-bold font-mono">{loyaltyPoints} pts</span>
              </div>
            )}
            {user?.role === 'customer' && (
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-3 bg-white border border-black/5 rounded-2xl transition-all hover:shadow-lg group"
              >
                <ShoppingBag size={20} className="text-[#141414]" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-[var(--primary-color)] text-white text-[10px] font-bold rounded-lg flex items-center justify-center border-2 border-white shadow-lg animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-30 font-bold">
                Platform Status
              </span>
              <span className="text-[10px] font-mono text-green-600 font-bold uppercase">
                v2.6.0-enterprise
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#F8F9FA]">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-10 max-w-[1600px] w-full mx-auto">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </div>
            <Footer />
          </div>
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
