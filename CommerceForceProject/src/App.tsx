/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LoginPage } from './pages/LoginPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

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
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
