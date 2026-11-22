import fs from 'fs';
import path from 'path';
import type { LocalDatabaseSnapshot } from '@/types';
import { DEFAULT_SETTINGS, SEED_PRODUCTS, SEED_STORES } from '@/lib/seed';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'concretando-db.json');

let memoryFallback: LocalDatabaseSnapshot | null = null;

function createSeedSnapshot(): LocalDatabaseSnapshot {
  return {
    settings: { ...DEFAULT_SETTINGS, updated_at: new Date().toISOString() },
    products: SEED_PRODUCTS.map((p) => ({ ...p })),
    stores: SEED_STORES.map((s) => ({ ...s })),
    quotes: [],
    orders: [],
    contacts: []
  };
}

export function readLocalDb(): LocalDatabaseSnapshot {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<LocalDatabaseSnapshot>;
      return {
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        products: Array.isArray(parsed.products) ? parsed.products : SEED_PRODUCTS.map((p) => ({ ...p })),
        stores: Array.isArray(parsed.stores) ? parsed.stores : SEED_STORES.map((s) => ({ ...s })),
        quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        contacts: Array.isArray(parsed.contacts) ? parsed.contacts : []
      };
    }
    const seeded = createSeedSnapshot();
    writeLocalDb(seeded);
    return seeded;
  } catch {
    if (!memoryFallback) {
      memoryFallback = createSeedSnapshot();
    }
    return memoryFallback;
  }
}

export function writeLocalDb(snapshot: LocalDatabaseSnapshot): void {
  memoryFallback = snapshot;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
  } catch {
    // Em ambientes serverless read-only (Vercel sem Supabase), mantém fallback em memória
  }
}

export function resetLocalDb(): LocalDatabaseSnapshot {
  const fresh = createSeedSnapshot();
  writeLocalDb(fresh);
  return fresh;
}
