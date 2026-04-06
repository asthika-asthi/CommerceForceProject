export interface BrandingConfig {
  id?: number;
  company_name: string;
  domain: string;
  logo_url?: string;
  primary_color?: string;
  created_at?: string;
}

export interface FeatureFlag {
  id?: number;
  feature_key: string;
  enabled: boolean;
  config_json: string;
  description?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  base_price: number;
  sale_percentage?: number;
  image_url?: string;
  is_active: boolean;
  allow_direct_buy: boolean;
  created_at?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address?: string;
  payment_method: 'prepaid' | 'credit' | 'credit_card' | 'paypal' | 'razorpay';
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  user?: User;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  is_active: boolean;
}

export interface Inventory {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  min_stock_level: number;
  updated_at: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface LoyaltyPoints {
  user_id: string;
  points: number;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  order_id?: string;
  points: number;
  type: 'earn' | 'redeem' | 'adjustment';
  description?: string;
  created_at: string;
}

export type RFQStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'converted';

export interface RFQItem {
  id: string;
  rfq_id: string;
  product_id: string;
  quantity: number;
  target_price?: number;
  quoted_price?: number;
  product?: Product;
}

export interface RFQ {
  id: string;
  user_id: string;
  status: RFQStatus;
  total_quoted_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  items?: RFQItem[];
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  sent_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  expiry_date?: string;
  usage_limit?: number;
  used_count: number;
  is_loyalty_only: boolean;
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  activeUsers: number;
  activeWarehouses: number;
  enabledFeatures: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  credit_limit?: number;
  available_credit?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
