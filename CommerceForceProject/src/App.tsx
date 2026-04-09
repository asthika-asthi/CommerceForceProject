/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component } from 'react';
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Branding } from './pages/admin/Branding';
import { FeatureFlags } from './pages/admin/FeatureFlags';
import { Products } from './pages/admin/Products';
import { Orders } from './pages/admin/Orders';
import { InventoryPage } from './pages/admin/Inventory';
import { LoyaltyAdmin } from './pages/admin/Loyalty';
import { RFQAdmin } from './pages/admin/RFQ';
import { EmailLogs } from './pages/admin/EmailLogs';
import { UsersAdmin } from './pages/admin/Users';
import { CouponsAdmin } from './pages/admin/Coupons';
import { InventoryAlerts } from './pages/admin/InventoryAlerts';
import { CustomerRFQ } from './pages/CustomerRFQ';
import { Checkout } from './pages/Checkout';
import { Cart } from './pages/Cart';
import { LandingPage } from './pages/LandingPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { BrandingProvider, useBranding } from './context/BrandingContext';
import { LoginPage } from './pages/LoginPage';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<any, any> {
  state = { hasError: false, error: null as any };

  constructor(props: any) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white p-12 rounded-[32px] border border-[#141414] shadow-xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-4 font-serif italic">Something went wrong</h1>
            <p className="text-sm opacity-60 mb-8 leading-relaxed">
              The application encountered an unexpected error. Please try refreshing the page or contact support if the issue persists.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#141414] text-white py-4 rounded-full font-bold hover:bg-black transition-all"
            >
              Refresh Page
            </button>
            <pre className="mt-8 p-4 bg-red-50 text-red-800 text-[10px] text-left overflow-auto rounded-xl max-h-40 font-mono">
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const { config } = useBranding();
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL path first
    const path = window.location.pathname.substring(1);
    const rootPath = path.split('/')[0];
    if (rootPath && ['landing', 'dashboard', 'branding', 'features', 'products', 'orders', 'inventory', 'loyalty', 'rfq', 'email', 'coupons', 'users', 'contact', 'cart', 'checkout'].includes(rootPath)) {
      return rootPath;
    }
    
    const saved = localStorage.getItem('activeTab');
    if (saved) return saved;
    return 'dashboard';
  });

  // Handle browser back/forward and manual URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.substring(1);
      const rootPath = path.split('/')[0];
      if (rootPath && ['landing', 'dashboard', 'branding', 'features', 'products', 'orders', 'inventory', 'loyalty', 'rfq', 'email', 'coupons', 'users', 'contact', 'cart', 'checkout'].includes(rootPath)) {
        setActiveTab(rootPath);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('activeTab', activeTab);
      // Update URL without reload if it doesn't match
      const currentPath = window.location.pathname.substring(1);
      if (currentPath !== activeTab) {
        window.history.pushState({}, '', `/${activeTab}`);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isLoading && user) {
      const navItems = [
        { id: 'landing', roles: ['customer', 'admin', 'superadmin', 'client'] },
        { id: 'dashboard', roles: ['admin', 'superadmin', 'client'] },
        { id: 'branding', roles: ['superadmin'] },
        { id: 'features', roles: ['superadmin'] },
        { id: 'products', roles: ['admin', 'superadmin', 'client', 'customer'] },
        { id: 'inventory', roles: ['admin', 'superadmin', 'client'] },
        { id: 'inventory-alerts', roles: ['admin', 'superadmin', 'client'] },
        { id: 'orders', roles: ['admin', 'superadmin', 'client'] },
        { id: 'rfq', roles: ['admin', 'superadmin', 'client'] },
        { id: 'loyalty', roles: ['admin', 'superadmin', 'client'] },
        { id: 'coupons', roles: ['admin', 'superadmin', 'client'] },
        { id: 'email', roles: ['superadmin'] },
        { id: 'users', roles: ['superadmin'] },
        { id: 'customer-rfq', roles: ['customer', 'admin', 'superadmin', 'client'] },
        { id: 'contact', roles: ['customer', 'admin', 'superadmin', 'client'] },
      ];

      const saved = localStorage.getItem('activeTab');
      const currentItem = navItems.find(i => i.id === saved);
      const hasAccess = currentItem?.roles.includes(user.role) ?? false;

      if (!saved || !hasAccess) {
        const defaultTab = user.role === 'customer' ? 'landing' : 'dashboard';
        setActiveTab(defaultTab);
      }
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <Loader2 className="animate-spin text-[#141414]" size={32} />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingPage onShopNow={() => setActiveTab('products')} />;
      case 'dashboard':
        return <Dashboard />;
      case 'branding':
        return <Branding />;
      case 'features':
        return <FeatureFlags />;
      case 'products':
        return <Products />;
      case 'orders':
        return <Orders />;
      case 'inventory':
        return <InventoryPage />;
      case 'loyalty':
        return <LoyaltyAdmin />;
      case 'rfq':
        return <RFQAdmin />;
      case 'email':
        return <EmailLogs />;
      case 'coupons':
        return <CouponsAdmin />;
      case 'inventory-alerts':
        return <InventoryAlerts />;
      case 'customer-rfq':
        return <CustomerRFQ />;
      case 'contact':
        return <ContactUsPage />;
      case 'checkout':
        return <Checkout onBack={() => setActiveTab('products')} />;
      case 'cart':
        return <Cart onCheckout={() => setActiveTab('checkout')} onBack={() => setActiveTab('products')} />;
      case 'users':
        return <UsersAdmin />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrandingProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </BrandingProvider>
    </ErrorBoundary>
  );
}
