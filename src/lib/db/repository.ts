import type {
  ContactMessage,
  LocalDatabaseSnapshot,
  OrderRecord,
  OrderStatus,
  Product,
  QuoteRecord,
  SiteSettings,
  StoreLocation
} from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/seed';
import { readLocalDb, resetLocalDb, writeLocalDb } from '@/lib/db/localStore';
import { getSupabaseServerClient } from '@/lib/db/supabaseClient';

export function getDatabaseEngine(): 'supabase' | 'local' {
  return getSupabaseServerClient() ? 'supabase' : 'local';
}

export async function dispatchWebhook(event: string, data: unknown, settings?: SiteSettings) {
  const url = settings?.webhook_url || process.env.WEBHOOK_ORDERS_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, timestamp: new Date().toISOString(), data })
    });
  } catch {
    // Não bloqueia o fluxo principal se webhook externo estiver fora
  }
}

/* ==================== SETTINGS ==================== */
export async function getSettings(): Promise<SiteSettings> {
  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb.from('site_settings').select('*').eq('id', 'default').maybeSingle();
    if (!error && data) {
      return {
        ...DEFAULT_SETTINGS,
        ...data,
        pix_discount_pct: Number(data.pix_discount_pct ?? DEFAULT_SETTINGS.pix_discount_pct),
        free_shipping_threshold: Number(data.free_shipping_threshold ?? DEFAULT_SETTINGS.free_shipping_threshold),
        shipping_capital_fee: Number(data.shipping_capital_fee ?? DEFAULT_SETTINGS.shipping_capital_fee),
        shipping_other_fee: Number(data.shipping_other_fee ?? DEFAULT_SETTINGS.shipping_other_fee)
      };
    }
  }
  return readLocalDb().settings;
}

export async function updateSettings(partial: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const merged: SiteSettings = {
    ...current,
    ...partial,
    id: 'default',
    pix_discount_pct: Number(partial.pix_discount_pct ?? current.pix_discount_pct),
    free_shipping_threshold: Number(partial.free_shipping_threshold ?? current.free_shipping_threshold),
    shipping_capital_fee: Number(partial.shipping_capital_fee ?? current.shipping_capital_fee),
    shipping_other_fee: Number(partial.shipping_other_fee ?? current.shipping_other_fee),
    updated_at: new Date().toISOString()
  };

  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb.from('site_settings').upsert([merged]).select().single();
    if (!error && data) return { ...merged, ...data };
  }

  const db = readLocalDb();
  db.settings = merged;
  writeLocalDb(db);
  return merged;
}

/* ==================== PRODUCTS ==================== */
export async function getProducts(includeInactive = false): Promise<Product[]> {
  const sb = getSupabaseServerClient();
  if (sb) {
    let query = sb.from('products').select('*').order('is_promo', { ascending: false });
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((p) => ({
        ...p,
        price: Number(p.price),
        original_price: p.original_price != null ? Number(p.original_price) : null,
        m2_units_per_m2: Number(p.m2_units_per_m2 ?? 1),
        m2_default_loss_pct: Number(p.m2_default_loss_pct ?? 10)
      }));
    }
  }
  const all = readLocalDb().products;
  return includeInactive ? all : all.filter((p) => p.active !== false);
}

export async function upsertProduct(product: Product): Promise<Product> {
  const normalized: Product = {
    ...product,
    id: product.id || `prod-${Date.now().toString(36)}`,
    sku: product.sku || `CON-${Math.floor(1000 + Math.random() * 9000)}`,
    price: Number(product.price),
    original_price: product.original_price ? Number(product.original_price) : null,
    stock: Number(product.stock ?? 0),
    m2_units_per_m2: Number(product.m2_units_per_m2 ?? 1),
    m2_default_loss_pct: Number(product.m2_default_loss_pct ?? 10),
    active: product.active !== false
  };

  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb.from('products').upsert([normalized]).select().single();
    if (!error && data) return data as Product;
  }

  const db = readLocalDb();
  const idx = db.products.findIndex((p) => p.id === normalized.id);
  if (idx >= 0) db.products[idx] = normalized;
  else db.products.unshift(normalized);
  writeLocalDb(db);
  return normalized;
}

export async function deleteProduct(id: string): Promise<void> {
  const sb = getSupabaseServerClient();
  if (sb) {
    const { error } = await sb.from('products').delete().eq('id', id);
    if (!error) return;
  }
  const db = readLocalDb();
  db.products = db.products.filter((p) => p.id !== id);
  writeLocalDb(db);
}

/* ==================== STORES ==================== */
export async function getStores(includeInactive = false): Promise<StoreLocation[]> {
  const sb = getSupabaseServerClient();
  if (sb) {
    let query = sb.from('stores').select('*').order('name', { ascending: true });
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query;
    if (!error && data && data.length > 0) return data as StoreLocation[];
  }
  const all = readLocalDb().stores;
  return includeInactive ? all : all.filter((s) => s.active !== false);
}

export async function upsertStore(store: StoreLocation): Promise<StoreLocation> {
  const normalized: StoreLocation = {
    ...store,
    id: store.id || `loja-${Date.now().toString(36)}`,
    active: store.active !== false
  };

  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb.from('stores').upsert([normalized]).select().single();
    if (!error && data) return data as StoreLocation;
  }

  const db = readLocalDb();
  const idx = db.stores.findIndex((s) => s.id === normalized.id);
  if (idx >= 0) db.stores[idx] = normalized;
  else db.stores.push(normalized);
  writeLocalDb(db);
  return normalized;
}

export async function deleteStore(id: string): Promise<void> {
  const sb = getSupabaseServerClient();
  if (sb) {
    const { error } = await sb.from('stores').delete().eq('id', id);
    if (!error) return;
  }
  const db = readLocalDb();
  db.stores = db.stores.filter((s) => s.id !== id);
  writeLocalDb(db);
}

/* ==================== QUOTES ==================== */
export async function getQuotes(): Promise<QuoteRecord[]> {
  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb.from('quotes').select('*').order('created_at', { ascending: false }).limit(100);
    if (!error && data) return data as QuoteRecord[];
  }
  return readLocalDb().quotes;
}

export async function createQuote(input: Omit<QuoteRecord, 'id' | 'quote_code' | 'status' | 'created_at'>): Promise<QuoteRecord> {
  const record: QuoteRecord = {
    ...input,
    quote_code: `COT-${Date.now().toString(36).toUpperCase()}`,
    status: 'aberta',
    created_at: new Date().toISOString()
  };

  const settings = await getSettings();
  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb.from('quotes').insert([record]).select().single();
    if (!error && data) {
      await dispatchWebhook('quote.created', data, settings);
      return data as QuoteRecord;
    }
  }

  const db = readLocalDb();
  const saved = { ...record, id: `q-${Date.now().toString(36)}` };
  db.quotes.unshift(saved);
  writeLocalDb(db);
  await dispatchWebhook('quote.created', saved, settings);
  return saved;
}

/* ==================== ORDERS ==================== */
export async function getOrders(): Promise<OrderRecord[]> {
  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
    if (!error && data) return data as OrderRecord[];
  }
  return readLocalDb().orders;
}

export async function createOrder(
  input: Omit<OrderRecord, 'id' | 'order_code' | 'pickup_code' | 'status' | 'created_at'>
): Promise<OrderRecord> {
  const isPickup = input.fulfillment_type === 'pickup';
  const record: OrderRecord = {
    ...input,
    order_code: `PED-${Date.now().toString(36).toUpperCase()}`,
    pickup_code: isPickup ? `RET-${Math.floor(100000 + Math.random() * 900000)}` : null,
    status: isPickup ? 'separacao' : 'confirmado',
    created_at: new Date().toISOString()
  };

  const settings = await getSettings();
  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb.from('orders').insert([record]).select().single();
    if (!error && data) {
      await dispatchWebhook('order.created', data, settings);
      return data as OrderRecord;
    }
  }

  const db = readLocalDb();
  const saved = { ...record, id: `ord-${Date.now().toString(36)}` };
  db.orders.unshift(saved);
  writeLocalDb(db);
  await dispatchWebhook('order.created', saved, settings);
  return saved;
}

export async function updateOrderStatus(orderCode: string, status: OrderStatus): Promise<OrderRecord | null> {
  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb
      .from('orders')
      .update({ status })
      .eq('order_code', orderCode)
      .select()
      .maybeSingle();
    if (!error && data) return data as OrderRecord;
  }

  const db = readLocalDb();
  const target = db.orders.find((o) => o.order_code === orderCode || o.id === orderCode);
  if (!target) return null;
  target.status = status;
  writeLocalDb(db);
  return target;
}

/* ==================== CONTACTS ==================== */
export async function getContacts(): Promise<ContactMessage[]> {
  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100);
    if (!error && data) return data as ContactMessage[];
  }
  return readLocalDb().contacts;
}

export async function createContact(input: Omit<ContactMessage, 'id' | 'status' | 'created_at'>): Promise<ContactMessage> {
  const record: ContactMessage = {
    ...input,
    status: 'nova',
    created_at: new Date().toISOString()
  };

  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb.from('contact_messages').insert([record]).select().single();
    if (!error && data) return data as ContactMessage;
  }

  const db = readLocalDb();
  const saved = { ...record, id: `msg-${Date.now().toString(36)}` };
  db.contacts.unshift(saved);
  writeLocalDb(db);
  return saved;
}

/* ==================== BACKUP / RESET (ADMIN) ==================== */
export async function exportFullSnapshot(): Promise<LocalDatabaseSnapshot> {
  const [settings, products, stores, quotes, orders, contacts] = await Promise.all([
    getSettings(),
    getProducts(true),
    getStores(true),
    getQuotes(),
    getOrders(),
    getContacts()
  ]);
  return { settings, products, stores, quotes, orders, contacts };
}

export function resetLocalDatabase(): LocalDatabaseSnapshot {
  return resetLocalDb();
}
