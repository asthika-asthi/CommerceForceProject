import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Flag, Package, Users, Menu, X, LogOut, ShoppingCart, Warehouse as WarehouseIcon, Award, FileText, Mail, Ticket, AlertTriangle, ShoppingBag, Coins, MessageSquare, ChevronDown, Database, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useBranding } from '../../context/BrandingContext';
import { CartModal } from '../CartModal';
import { Footer } from '../Footer';
import { AIChat } from '../AIChat';
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
  const [categories, setCategories] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(['Overview']); // Default open
  const { user, logout, token } = useAuth();
  const { totalItems } = useCart();
  const { config } = useBranding();

  const b2bEnabled = features.find(f => f.feature_key === 'b2b_enabled')?.enabled ?? true;
  const rfqEnabled = features.find(f => f.feature_key === 'rfq_enabled')?.enabled ?? true;
  const loyaltyEnabled = features.find(f => f.feature_key === 'loyalty_program')?.enabled ?? true;

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  useEffect(() => {
    if (token) {
      const fetchPoints = () => {
        fetch('/api/loyalty/my/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => {
            if (!res.ok) {
              if (res.status === 401) return { balance: 0 }; // Gracefully handle expired/invalid session
              throw new Error(`Failed to fetch balance: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            if (typeof data.balance === 'number') {
              setLoyaltyPoints(data.balance);
            }
          })
          .catch(err => console.error('Error fetching loyalty points:', err));
      };

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

      // Always check for points if logged in, as any role might have earned them
      fetchPoints();

      // Fetch categories
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const cats = Array.from(new Set(data.map((p: any) => p.category).filter(Boolean))) as string[];
            setCategories(cats);
          }
        })
        .catch(err => console.error('Failed to fetch categories:', err));

      // Global event listener for points refresh
      const handlePointsRefresh = () => fetchPoints();
      window.addEventListener('refreshPoints', handlePointsRefresh);
      return () => window.removeEventListener('refreshPoints', handlePointsRefresh);
    }
  }, [token]);

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    roles: string[];
    feature?: string;
    enabled?: boolean;
    onClick?: () => void;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
    feature?: string;
    roles?: string[];
  }

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { id: 'landing', label: 'Home', icon: ShoppingBag, roles: ['customer', 'admin', 'superadmin', 'client'] },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'superadmin', 'client'] },
      ]
    },
    {
      title: 'Store',
      items: [
        { id: 'products', label: 'Products', icon: Package, roles: ['admin', 'superadmin', 'client', 'customer'] },
        { id: 'orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'superadmin', 'client'] },
        { id: 'coupons', label: 'Promotions', icon: Ticket, roles: ['admin', 'superadmin', 'client'] },
        { id: 'rfq', label: 'RFQs', icon: FileText, roles: ['admin', 'superadmin', 'client'], feature: 'rfq_enabled' },
      ]
    },
    {
      title: 'Inventory',
      feature: 'b2b_enabled',
      items: [
        { id: 'inventory', label: 'Stock Levels', icon: WarehouseIcon, roles: ['admin', 'superadmin', 'client'], feature: 'b2b_enabled' },
        { id: 'inventory-alerts', label: 'Alerts', icon: AlertTriangle, roles: ['admin', 'superadmin', 'client'], feature: 'b2b_enabled' },
      ]
    },
    {
      title: 'Engagement',
      feature: 'loyalty_program',
      items: [
        { id: 'loyalty', label: 'Loyalty Program', icon: Award, roles: ['admin', 'superadmin', 'client'], feature: 'loyalty_program' },
      ]
    },
    {
      title: 'System Admin',
      roles: ['superadmin'],
      items: [
        { id: 'branding', label: 'Branding', icon: Settings, roles: ['superadmin'] },
        { id: 'features', label: 'Feature Flags', icon: Flag, roles: ['superadmin'] },
        { id: 'users', label: 'Users', icon: Users, roles: ['superadmin'] },
        { id: 'email', label: 'Email Logs', icon: Mail, roles: ['superadmin'] },
        { id: 'system-tools', label: 'System Tools', icon: Database, roles: ['superadmin'] },
      ]
    },
    {
      title: 'Help & Support',
      items: [
        { id: 'customer-rfq', label: 'My RFQs', icon: FileText, roles: ['customer', 'admin', 'superadmin', 'client'], feature: 'rfq_enabled' },
        { id: 'contact', label: 'Support Center', icon: MessageSquare, roles: ['customer', 'admin', 'superadmin', 'client'], enabled: config?.contact_page_enabled },
        { id: 'contact-us', label: 'Contact Us', icon: Mail, roles: ['customer', 'admin', 'superadmin', 'client'] },
        { id: 'faq', label: 'FAQ', icon: HelpCircle, roles: ['customer', 'admin', 'superadmin', 'client'] },
        ...(config?.catalogue_url ? [{ 
          id: 'catalogue', 
          label: 'Catalogue', 
          icon: FileText, 
          roles: ['customer', 'admin', 'superadmin', 'client'],
          onClick: () => window.open(config.catalogue_url, '_blank')
        }] : [])
      ]
    }
  ];

  const filteredSections = navSections.filter(section => {
    // Check if section has required roles
    if (section.roles && !section.roles.includes(user?.role || '')) return false;
    
    // Check if section feature is enabled
    if (section.feature) {
      const featureFlag = features.find(f => f.feature_key === section.feature);
      if (!(featureFlag?.enabled ?? true)) return false;
    }

    // Filter items within section
    const filteredItems = section.items.filter(item => {
      const hasRole = item.roles.includes(user?.role || '');
      const featureFlag = features.find(f => f.feature_key === item.feature);
      const isFeatureEnabled = item.feature ? (featureFlag?.enabled ?? true) : true;
      const isExplicitlyEnabled = item.enabled !== undefined ? item.enabled : true;
      return hasRole && isFeatureEnabled && isExplicitlyEnabled;
    });

    section.items = filteredItems;
    return filteredItems.length > 0;
  });

  const hideSidebar = !user || filteredSections.length === 0;

  return (
    <div className="min-h-screen flex font-[var(--font-family)] bg-[#fdfdfd]">
      {/* Sidebar */}
      {!hideSidebar && (
        <aside 
          className={`${
            isSidebarOpen ? 'w-72' : 'w-24'
          } border-r border-black/5 transition-all duration-300 flex flex-col bg-white shadow-xl z-20 sticky top-0 h-screen`}
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

          <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto custom-scrollbar">
            {filteredSections.map((section) => (
              <div key={section.title} className="space-y-1">
                {isSidebarOpen ? (
                  <button 
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-4 text-[10px] font-mono uppercase opacity-40 tracking-widest font-bold mb-2 hover:opacity-100 transition-opacity group"
                  >
                    <span>{section.title}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${openSections.includes(section.title) ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <div className="h-px bg-black/5 my-4 mx-2" />
                )}
                
                <AnimatePresence>
                  {(openSections.includes(section.title) || !isSidebarOpen) && (
                    <motion.div
                      initial={isSidebarOpen ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-1"
                    >
                      {section.items.map((item) => (
                        <NavItem
                          key={item.id}
                          icon={item.icon}
                          label={isSidebarOpen ? item.label : ''}
                          active={activeTab === item.id}
                          onClick={item.onClick || (() => setActiveTab(item.id))}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-black/5 bg-white/80 backdrop-blur-md z-10 sticky top-0">
          <div className="max-w-[1600px] w-full mx-auto px-6 md:px-10 h-full flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="font-bold text-xl text-[#141414] tracking-tight">
                {navSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || config?.company_name || 'CommerceForce'}
              </h1>
              
              <nav className="hidden lg:flex items-center gap-8">
                <div className="relative group">
                  <button className="text-sm font-medium text-[#141414]/60 hover:text-[#141414] flex items-center gap-1 transition-colors">
                    Categories <ChevronDown size={14} />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-black/5 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 transform origin-top scale-95 group-hover:scale-100">
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            window.history.pushState({}, '', `/category/${cat}`);
                            window.dispatchEvent(new PopStateEvent('popstate'));
                            setActiveTab('category');
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-[#141414]/60 hover:text-[#141414] hover:bg-black/5 rounded-xl transition-all capitalize font-medium"
                        >
                          {cat}
                        </button>
                      ))
                    ) : (
                      <span className="block px-4 py-3 text-xs text-[#141414]/40 italic">No categories</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('products')}
                  className="text-sm font-medium text-[#141414]/60 hover:text-[#141414] transition-colors"
                >
                  Products
                </button>
                <button 
                  onClick={() => setActiveTab('contact')}
                  className="text-sm font-medium text-[#141414]/60 hover:text-[#141414] transition-colors"
                >
                  Support
                </button>
                <button 
                  onClick={() => setActiveTab('contact-us')}
                  className="text-sm font-medium text-[#141414]/60 hover:text-[#141414] transition-colors"
                >
                  Contact
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-4 mr-4 border-r border-black/5 pr-6">
                {user ? (
                  <button 
                    onClick={logout}
                    className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 hover:text-red-600 transition-colors"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        window.history.pushState({}, '', '/login');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 hover:text-[#141414] transition-colors"
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => {
                        window.history.pushState({}, '', '/register');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 hover:text-[#141414] transition-colors"
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
              {user?.role === 'customer' && loyaltyEnabled && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shadow-sm" title={config?.loyalty_program_name || 'Loyalty Points'}>
                  <Award size={16} />
                  <span className="text-xs font-bold font-mono">{loyaltyPoints} {config?.loyalty_program_name ? '' : 'pts'}</span>
                  {config?.loyalty_program_name && <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-1">{config.loyalty_program_name}</span>}
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
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-6 md:p-10 max-w-[1600px] w-full mx-auto">
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
      <AIChat />
    </div>
  );
};
