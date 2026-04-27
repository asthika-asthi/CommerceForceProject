export interface BrandingConfig {
  id?: number;
  company_name: string;
  domain: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  button_style?: 'rounded' | 'square' | 'pill';
  background_style?: 'solid' | 'gradient' | 'image';
  background_value?: string; // Color, gradient string, or image URL
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  hero_cta_text?: string;
  hero_cta_link?: string;
  featured_products?: string; // JSON string of product IDs
  layout_config?: string; // JSON string of LayoutSection[]
  footer_config?: string; // JSON string for footer links and social
  footer_email?: string;
  footer_address?: string;
  footer_phone?: string;
  footer_copyright?: string;
  footer_use_brand_color?: boolean;
  social_links_enabled?: boolean;
  contact_page_enabled?: boolean;
  payment_methods_config?: string; // JSON string of PaymentMethodConfig[]
  currency_symbol?: string;
  currency_code?: string;
  base_font_size?: number;
  hero_font_size?: number;
  heading_font_size?: number;
  content_font_size?: number;
  carousel_enabled?: boolean;
  hero_enabled?: boolean;
  carousel_images?: string; // JSON string of CarouselImage[]
  catalogue_url?: string;
  admin_email?: string;
  footer_tagline?: string;
  loyalty_points_per_currency?: number;
  loyalty_redemption_value?: number;
  loyalty_program_name?: string;
  loyalty_banner_image?: string;
  category_display_style?: 'dropdown' | 'inline';
  // Font Customization
  nav_font_family?: string;
  nav_text_color?: string;
  sidebar_font_size?: number;
  sidebar_font_weight?: string;
  top_nav_font_size?: number;
  top_nav_font_weight?: string;
  nav_heading_color?: string;
  nav_heading_font_weight?: string;
  sidebar_background_style?: 'default' | 'primary' | 'secondary' | 'accent' | 'image';
  sidebar_background_value?: string;
  top_nav_background_style?: 'default' | 'primary' | 'secondary' | 'accent' | 'image';
  top_nav_background_value?: string;
  footer_background_style?: 'default' | 'primary' | 'secondary' | 'accent' | 'image';
  footer_background_value?: string;
  created_at?: string;
}

export interface CarouselImage {
  url: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
  type: 'cash' | 'credit_limit' | 'stripe' | 'paypal' | 'razorpay';
  config?: {
    publicKey?: string;
    secretKey?: string;
    merchantId?: string;
    [key: string]: any;
  };
}

export interface ElementStyles {
  textColor?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
  fontSize?: number | string;
  fontWeight?: string;
  fontFamily?: string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  borderRadius?: number | string;
  borderWidth?: number | string;
  borderColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  display?: 'block' | 'none' | 'flex' | 'grid';
  opacity?: number;
  gap?: number | string;
  columns?: number;
}

export interface ResponsiveStyles {
  mobile?: ElementStyles;
  tablet?: ElementStyles;
  desktop?: ElementStyles;
}

export interface ComponentStyles {
  container?: ResponsiveStyles;
  content?: ResponsiveStyles;
  title?: ResponsiveStyles;
  subtitle?: ResponsiveStyles;
  button?: ResponsiveStyles;
  card?: ResponsiveStyles;
  icon?: ResponsiveStyles;
  grid?: {
    mobile?: { columns?: number; gap?: number | string };
    tablet?: { columns?: number; gap?: number | string };
    desktop?: { columns?: number; gap?: number | string };
  };
}

export interface LayoutSection {
  id: string;
  type: 'hero' | 'features' | 'products' | 'promotions' | 'content' | 'testimonials' | 'faq' | 'cta' | 'carousel' | 'category_grid';
  enabled: boolean;
  config: any;
  styles?: ComponentStyles;
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
  images?: string[]; // Array of image URLs
  is_active: boolean;
  is_featured?: boolean;
  allow_direct_buy: boolean;
  total_stock?: number;
  created_at?: string;
}

export interface Category {
  id: number;
  parent_id?: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  show_in_menu: boolean;
  sort_order: number;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
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
  payment_method: string;
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
  min_quantity?: number;
  max_discount_amount?: number;
  expiry_date?: string;
  usage_limit?: number;
  used_count: number;
  is_loyalty_only: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name?: string;
  action: string;
  details?: string;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  activeUsers: number;
  activeWarehouses: number;
  enabledFeatures: number;
  recentActivity?: ActivityLog[];
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

export interface PendingAction {
  type: 'ADD_TO_CART' | 'BUY_NOW' | 'REQUEST_QUOTE' | 'CHECKOUT';
  data: any;
  redirectTo?: string;
}
