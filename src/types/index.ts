export type ProductCategory = 'alvenaria' | 'aco' | 'cobertura' | 'acabamento' | 'basicos';

export interface SiteSettings {
  id: string;
  brand_name: string;
  slogan: string;
  primary_color: string;
  promo_ribbon_text: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_label: string;
  whatsapp_number: string;
  contact_email: string;
  contact_phone: string;
  pix_discount_pct: number;
  free_shipping_threshold: number;
  shipping_capital_fee: number;
  shipping_other_fee: number;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  maintenance_mode: boolean;
  webhook_url: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: string;
  price: number;
  original_price: number | null;
  is_promo: boolean;
  promo_badge: string | null;
  stock: number;
  pickup_ready: boolean;
  pickup_time_label: string;
  m2_supported: boolean;
  m2_units_per_m2: number;
  m2_default_loss_pct: number;
  m2_application: string;
  image_url: string;
  short_description: string;
  active?: boolean;
  created_at?: string;
}

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  phone: string;
  hours: string;
  pickup_dock_info: string;
  active?: boolean;
}

export interface CartItem {
  product_id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  image_url: string;
  quantity: number;
  note?: string;
}

export interface QuoteRecord {
  id?: string;
  quote_code: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  product_id: string | null;
  product_name: string;
  width_m: number | null;
  length_m: number | null;
  area_m2: number;
  loss_pct: number;
  total_area_with_loss: number;
  calculated_quantity: number;
  unit: string;
  unit_price: number;
  estimated_total: number;
  delivery_mode: 'pickup' | 'delivery';
  store_id?: string | null;
  notes?: string | null;
  status: 'aberta' | 'aprovada' | 'convertida' | 'expirada';
  created_at: string;
}

export type OrderStatus =
  | 'pendente'
  | 'confirmado'
  | 'separacao'
  | 'pronto_retirada'
  | 'em_transporte'
  | 'concluido'
  | 'cancelado';

export interface OrderRecord {
  id?: string;
  order_code: string;
  pickup_code: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_document?: string | null;
  fulfillment_type: 'pickup' | 'delivery';
  store_id?: string | null;
  store_name?: string | null;
  pickup_date?: string | null;
  pickup_slot?: string | null;
  delivery_cep?: string | null;
  delivery_address?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  payment_method: 'pix' | 'cartao' | 'boleto';
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  items: CartItem[];
  status: OrderStatus;
  created_at: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export interface LocalDatabaseSnapshot {
  settings: SiteSettings;
  products: Product[];
  stores: StoreLocation[];
  quotes: QuoteRecord[];
  orders: OrderRecord[];
  contacts: ContactMessage[];
}
