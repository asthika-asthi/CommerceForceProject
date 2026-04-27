import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Flag, Package, Users, Menu, X, LogOut, ShoppingCart, Warehouse as WarehouseIcon, Award, FileText, Mail, Ticket, AlertTriangle, ShoppingBag, Coins, MessageSquare, ChevronDown, Database, HelpCircle, Sparkles, Layers } from 'lucide-react';
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
    style={{ 
      fontFamily: 'var(--nav-font-family)', 
      color: active ? 'white' : 'var(--nav-text-color)', 
      fontSize: 'var(--sidebar-font-size)',
      fontWeight: 'var(--sidebar-font-weight)'
    }}
    className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
      active 
        ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20 rounded-xl' 
        : 'opacity-70 hover:opacity-100 hover:bg-black/5 rounded-xl'
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
  const [hasPromotions, setHasPromotions] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['Overview']); // Default open
  const { user, logout, token } = useAuth();
  const { totalItems } = useCart();
  const { config } = useBranding();

  // Auto-collapse sidebar on mobile screens
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const b2bEnabled = features.find(f => f.feature_key === 'b2b_enabled')?.enabled ?? true;
  const rfqEnabled = features.find(f => f.feature_key === 'rfq_enabled')?.enabled ?? true;
  const loyaltyEnabled = features.find(f => f.feature_key === 'loyalty_program')?.enabled ?? false;

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  useEffect(() => {
    // Fetch public categories and promotions
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const cats = Array.from(new Set(data.map((p: any) => p.category).filter(Boolean))) as string[];
          setCategories(cats);
          
          // Check for sale items
          const hasSales = data.some((p: any) => (p.sale_percentage || 0) > 0 && p.is_active);
          if (hasSales) {
            setHasPromotions(true);
          } else {
            // Check for active coupons
            fetch('/api/coupons')
              .then(res => res.json())
              .then(coupons => {
                if (Array.isArray(coupons)) {
                  const activeCoupons = coupons.some((c: any) => {
                    if (!c.is_active) return false;
                    if (c.expiry_date && new Date(c.expiry_date) < new Date()) return false;
                    if (c.usage_limit && c.used_count >= c.usage_limit) return false;
                    return true;
                  });
                  setHasPromotions(activeCoupons);
                }
              });
          }
        }
      })
      .catch(err => console.error('Failed to fetch categories/promotions:', err));
  }, []);

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
        { id: 'categories', label: 'Categories', icon: Layers, roles: ['admin', 'superadmin', 'client'] },
        { id: 'my-orders', label: 'MyOrders', icon: ShoppingCart, roles: ['customer'] },
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

  const filteredSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        const hasRole = item.roles.includes(user?.role || '');
        const featureFlag = features.find(f => f.feature_key === item.feature);
        const isFeatureEnabled = item.feature ? (featureFlag?.enabled ?? true) : true;
        const isExplicitlyEnabled = item.enabled !== undefined ? item.enabled : true;
        return hasRole && isFeatureEnabled && isExplicitlyEnabled;
      })
    }))
    .filter(section => {
      // Check if section has required roles
      if (section.roles && !section.roles.includes(user?.role || '')) return false;
      
      // Check if section feature is enabled
      if (section.feature) {
        const featureFlag = features.find(f => f.feature_key === section.feature);
        if (!(featureFlag?.enabled ?? true)) return false;
      }

      return section.items.length > 0;
    });

  const getSidebarStyle = () => {
    if (!config) return {};
    
    switch (config.sidebar_background_style) {
      case 'primary':
        return { backgroundColor: config.primary_color || '#1A56DB', borderRightColor: 'rgba(255,255,255,0.1)' };
      case 'secondary':
        return { backgroundColor: config.secondary_color || '#4B5563', borderRightColor: 'rgba(255,255,255,0.1)' };
      case 'accent':
        return { backgroundColor: 'var(--primary-color-light)', borderRightColor: 'var(--primary-color)' };
      case 'image':
        return { 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${config.sidebar_background_value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRight: 'none',
          borderRadius: '1.5rem'
        };
      default:
        return { backgroundColor: 'white', borderRadius: '1.5rem' };
    }
  };

  const getHeaderStyle = () => {
    if (!config) return {};
    
    switch (config.top_nav_background_style) {
      case 'primary':
        return { backgroundColor: config.primary_color || '#1A56DB', borderBottomColor: 'rgba(255,255,255,0.1)', borderRadius: '1.5rem' };
      case 'secondary':
        return { backgroundColor: config.secondary_color || '#4B5563', borderBottomColor: 'rgba(255,255,255,0.1)', borderRadius: '1.5rem' };
      case 'accent':
        return { backgroundColor: 'var(--primary-color-light)', borderBottomColor: 'var(--primary-color)', borderRadius: '1.5rem' };
      case 'image':
        return { 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${config.top_nav_background_value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: 'none',
          borderRadius: '1.5rem'
        };
      default:
        return { backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '1.5rem' };
    }
  };

  const sidebarStyle = getSidebarStyle();
  const isDarkSidebar = ['primary', 'secondary', 'image'].includes(config?.sidebar_background_style || '');

  const headerStyle = getHeaderStyle();
  const isDarkHeader = ['primary', 'secondary', 'image'].includes(config?.top_nav_background_style || '');

  const hideSidebar = !user || filteredSections.length === 0;

  return (
    <div className="min-h-screen flex font-[var(--font-family)] bg-[#fdfdfd] relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {!hideSidebar && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      {!hideSidebar && (
        <aside 
          style={sidebarStyle}
          className={`
            fixed lg:sticky top-4 left-4 z-50 lg:z-20
            ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-[calc(100%+2rem)] lg:translate-x-0 lg:w-24'}
            transition-all duration-300 flex flex-col shadow-xl 
            h-[calc(100vh-2rem)] overflow-hidden m-4
          `}
        >
          <div className="p-8 flex items-center justify-between relative z-10">
            {isSidebarOpen && (
              <div className="flex items-center gap-3">
                {config?.logo_url ? (
                  <img src={config.logo_url} alt="Logo" className={`h-8 w-auto object-contain ${isDarkSidebar ? 'brightness-0 invert' : ''}`} referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary-color)] flex items-center justify-center text-white font-bold">
                    {config?.company_name?.charAt(0) || 'C'}
                  </div>
                )}
                <span 
                  style={{ color: isDarkSidebar ? 'white' : 'var(--nav-text-color)' }}
                  className="font-bold text-lg tracking-tight truncate max-w-[140px]"
                >
                  {config?.company_name || 'CommerceForce'}
                </span>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ color: isDarkSidebar ? 'white' : 'var(--nav-text-color)' }}
              className={`p-2 rounded-xl transition-colors ${isDarkSidebar ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto custom-scrollbar relative z-10">
            {filteredSections.map((section) => (
              <div key={section.title} className="space-y-1">
                {isSidebarOpen ? (
                  <button 
                    onClick={() => toggleSection(section.title)}
                    style={{ 
                      color: isDarkSidebar ? 'rgba(255,255,255,0.6)' : 'var(--nav-heading-color)',
                      fontWeight: 'var(--nav-heading-font-weight)' as any,
                      fontSize: 'var(--sidebar-font-size)'
                    }}
                    className="w-full flex items-center justify-between px-4 font-mono uppercase tracking-widest mb-2 hover:opacity-100 transition-opacity group scale-90 origin-left"
                  >
                    <span>{section.title}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${openSections.includes(section.title) ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <div className={`h-px my-4 mx-2 ${isDarkSidebar ? 'bg-white/10' : 'bg-black/5'}`} />
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
            <div className={`flex items-center justify-between gap-3 p-3 rounded-2xl ${isDarkSidebar ? 'bg-white/10' : 'bg-black/5'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-[var(--primary-color)]/20">
                  {user?.name?.substring(0, 2).toUpperCase() || 'CF'}
                </div>
                {isSidebarOpen && (
                  <div className="flex flex-col overflow-hidden">
                    <span className={`text-xs font-bold truncate ${isDarkSidebar ? 'text-white' : 'text-[#141414]'}`}>{user?.name}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${isDarkSidebar ? 'text-white/50' : 'text-[#141414]/50'}`}>{user?.role}</span>
                  </div>
                )}
              </div>
              {isSidebarOpen && (
                <button 
                  onClick={logout}
                  className={`p-2 rounded-xl transition-all shadow-sm ${isDarkSidebar ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-white text-[#141414]/60 hover:text-red-600'}`}
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
        <header 
          style={headerStyle}
          className="h-20 border-b border-black/5 z-10 sticky top-4 mx-4 transition-all duration-500 shadow-sm"
        >
          <div className="max-w-[1600px] w-full mx-auto px-6 md:px-10 h-full flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4 md:gap-8">
              {/* Mobile Menu Toggle */}
              {!hideSidebar && (
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  style={{ color: isDarkHeader ? 'white' : 'var(--nav-text-color)' }}
                  className={`lg:hidden p-2 rounded-xl transition-colors ${isDarkHeader ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  <Menu size={20} />
                </button>
              )}
              
              <h1 
                style={{ color: isDarkHeader ? 'white' : 'var(--nav-text-color)' }}
                className="font-bold text-lg tracking-tight"
              >
                {navSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || config?.company_name || 'CommerceForce'}
              </h1>
              
              <nav className="hidden lg:flex items-center gap-8">
                {config?.category_display_style === 'inline' ? (
                  <div className="flex items-center gap-6">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          window.history.pushState({}, '', `/category/${cat}`);
                          window.dispatchEvent(new PopStateEvent('popstate'));
                          setActiveTab('category');
                        }}
                        style={{ 
                          fontFamily: 'var(--nav-font-family)', 
                          color: isDarkHeader ? 'white' : 'var(--nav-text-color)',
                          fontSize: 'var(--top-nav-font-size)',
                          fontWeight: 'var(--top-nav-font-weight)'
                        }}
                        className={`transition-colors capitalize whitespace-nowrap ${isDarkHeader ? 'opacity-70 hover:opacity-100' : 'opacity-60 hover:opacity-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="relative group">
                    <button 
                      style={{ 
                        fontFamily: 'var(--nav-font-family)', 
                        color: isDarkHeader ? 'white' : 'var(--nav-text-color)', 
                        fontSize: 'var(--top-nav-font-size)',
                        fontWeight: 'var(--top-nav-font-weight)'
                      }}
                      className={`flex items-center gap-1 transition-colors ${isDarkHeader ? 'opacity-70 hover:opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
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
                            style={{ 
                              fontFamily: 'var(--nav-font-family)', 
                              color: 'var(--nav-text-color)',
                              fontWeight: 'var(--top-nav-font-weight)'
                            }}
                            className="w-full text-left px-4 py-3 text-sm opacity-60 hover:opacity-100 hover:bg-black/5 rounded-xl transition-all capitalize"
                          >
                            {cat}
                          </button>
                        ))
                      ) : (
                        <span className="block px-4 py-3 text-xs text-[#141414]/40 italic">No categories</span>
                      )}
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => setActiveTab('products')}
                  style={{ 
                    fontFamily: 'var(--nav-font-family)', 
                    color: isDarkHeader ? 'white' : 'var(--nav-text-color)', 
                    fontSize: 'var(--top-nav-font-size)',
                    fontWeight: 'var(--top-nav-font-weight)'
                  }}
                  className={`transition-colors ${isDarkHeader ? 'opacity-70 hover:opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  Products
                </button>
                {hasPromotions && (
                  <button 
                    onClick={() => setActiveTab('promotions')}
                    style={{ 
                      fontFamily: 'var(--nav-font-family)', 
                      color: isDarkHeader ? '#FDA4AF' : '#E11D48', // Lighter rose for dark header
                      fontSize: 'var(--top-nav-font-size)',
                      fontWeight: 'bold'
                    }}
                    className="flex items-center gap-1 opacity-90 hover:opacity-100 transition-all hover:scale-105"
                  >
                    <Sparkles size={14} className="animate-pulse" />
                    Offers
                  </button>
                )}
                <button 
                  onClick={() => setActiveTab('contact')}
                  style={{ 
                    fontFamily: 'var(--nav-font-family)', 
                    color: isDarkHeader ? 'white' : 'var(--nav-text-color)', 
                    fontSize: 'var(--top-nav-font-size)',
                    fontWeight: 'var(--top-nav-font-weight)'
                  }}
                  className={`transition-colors ${isDarkHeader ? 'opacity-70 hover:opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  Support
                </button>
                <button 
                  onClick={() => setActiveTab('contact-us')}
                  style={{ 
                    fontFamily: 'var(--nav-font-family)', 
                    color: isDarkHeader ? 'white' : 'var(--nav-text-color)', 
                    fontSize: 'var(--top-nav-font-size)',
                    fontWeight: 'var(--top-nav-font-weight)'
                  }}
                  className={`transition-colors ${isDarkHeader ? 'opacity-70 hover:opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  Contact
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-6">
              <div className={`hidden sm:flex items-center gap-4 mr-4 border-r pr-6 ${isDarkHeader ? 'border-white/10' : 'border-black/5'}`}>
                {user ? (
                  <button 
                    onClick={logout}
                    className={`text-xs font-bold uppercase tracking-widest transition-colors ${isDarkHeader ? 'text-white/60 hover:text-white' : 'text-[#141414]/40 hover:text-red-600'}`}
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
                      style={{ color: isDarkHeader ? 'white' : 'var(--nav-text-color)' }}
                      className={`text-xs font-bold uppercase tracking-widest transition-colors ${isDarkHeader ? 'opacity-70 hover:opacity-100' : 'opacity-40 hover:opacity-100'}`}
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => {
                        window.history.pushState({}, '', '/register');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      style={{ color: isDarkHeader ? 'white' : 'var(--nav-text-color)' }}
                      className={`text-xs font-bold uppercase tracking-widest transition-colors ${isDarkHeader ? 'opacity-70 hover:opacity-100' : 'opacity-40 hover:opacity-100'}`}
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
              {user?.role === 'customer' && loyaltyEnabled && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm ${isDarkHeader ? 'bg-amber-400/10 text-amber-300 border-amber-400/20' : 'bg-amber-50 text-amber-700 border-amber-100'}`} title={config?.loyalty_program_name || 'Loyalty Points'}>
                  <Award size={16} />
                  <span className="text-xs font-bold font-mono">{loyaltyPoints} {config?.loyalty_program_name ? '' : 'pts'}</span>
                  {config?.loyalty_program_name && <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-1">{config.loyalty_program_name}</span>}
                </div>
              )}
              {user?.role === 'customer' && (
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className={`relative p-3 border rounded-2xl transition-all hover:shadow-lg group ${isDarkHeader ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-white border-black/5 '}`}
                >
                  <ShoppingCart size={20} style={{ color: isDarkHeader ? 'white' : 'var(--nav-text-color)' }} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-[var(--primary-color)] text-white text-[10px] font-bold rounded-lg flex items-center justify-center border-2 border-white shadow-lg animate-in zoom-in duration-300">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}
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
