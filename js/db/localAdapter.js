(function (global) {
  'use strict';

  const Concretando = (global.Concretando = global.Concretando || {});
  const DB_NAME = 'ConcretandoLocalDB';
  const DB_VERSION = 1;
  const STORES = ['products', 'stores', 'quotes', 'orders', 'contacts', 'users', 'meta'];
  const LS_PREFIX = 'concretando_localdb_';

  function LocalDatabaseAdapter() {
    this.db = null;
    this.engine = 'localStorage';
  }

  LocalDatabaseAdapter.prototype.init = async function () {
    if (typeof indexedDB !== 'undefined') {
      try {
        this.db = await new Promise((resolve, reject) => {
          const req = indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = (event) => {
            const db = event.target.result;
            STORES.forEach((storeName) => {
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id' });
              }
            });
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        this.engine = 'IndexedDB';
      } catch (err) {
        console.warn('[LocalDB] IndexedDB indisponível, usando localStorage:', err);
        this.db = null;
        this.engine = 'localStorage';
      }
    }

    await this.seedIfEmpty();
    return this.engine;
  };

  LocalDatabaseAdapter.prototype.getAll = async function (table) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(table, 'readonly');
        const store = tx.objectStore(table);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    }
    try {
      const raw = localStorage.getItem(LS_PREFIX + table);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  };

  LocalDatabaseAdapter.prototype.put = async function (table, record) {
    const item = Object.assign({}, record);
    if (!item.id) {
      item.id = `${table}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    }
    if (!item.created_at) {
      item.created_at = new Date().toISOString();
    }

    if (this.db) {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction(table, 'readwrite');
        tx.objectStore(table).put(item);
        tx.oncomplete = () => resolve(item);
        tx.onerror = () => reject(tx.error);
      });
      return item;
    }

    const list = await this.getAll(table);
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) list[idx] = item;
    else list.unshift(item);
    localStorage.setItem(LS_PREFIX + table, JSON.stringify(list));
    return item;
  };

  LocalDatabaseAdapter.prototype.delete = async function (table, id) {
    if (this.db) {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction(table, 'readwrite');
        tx.objectStore(table).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return;
    }
    const list = (await this.getAll(table)).filter((x) => x.id !== id);
    localStorage.setItem(LS_PREFIX + table, JSON.stringify(list));
  };

  LocalDatabaseAdapter.prototype.clear = async function (table) {
    if (this.db) {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction(table, 'readwrite');
        tx.objectStore(table).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return;
    }
    localStorage.removeItem(LS_PREFIX + table);
  };

  LocalDatabaseAdapter.prototype.seedIfEmpty = async function () {
    const products = await this.getAll('products');
    if (products.length === 0) {
      for (const p of Concretando.seed.SEED_PRODUCTS) {
        await this.put('products', p);
      }
    }
    const stores = await this.getAll('stores');
    if (stores.length === 0) {
      for (const s of Concretando.seed.SEED_STORES) {
        await this.put('stores', s);
      }
    }
  };

  LocalDatabaseAdapter.prototype.exportSnapshot = async function () {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      engine: this.engine,
      tables: {}
    };
    for (const table of ['products', 'stores', 'quotes', 'orders', 'contacts', 'users']) {
      snapshot.tables[table] = await this.getAll(table);
    }
    return snapshot;
  };

  LocalDatabaseAdapter.prototype.importSnapshot = async function (snapshot) {
    if (!snapshot || !snapshot.tables) {
      throw new Error('Arquivo JSON de backup inválido.');
    }
    for (const table of Object.keys(snapshot.tables)) {
      if (!STORES.includes(table)) continue;
      await this.clear(table);
      const rows = Array.isArray(snapshot.tables[table]) ? snapshot.tables[table] : [];
      for (const row of rows) {
        await this.put(table, row);
      }
    }
  };

  LocalDatabaseAdapter.prototype.resetToSeed = async function () {
    for (const table of ['products', 'stores', 'quotes', 'orders', 'contacts']) {
      await this.clear(table);
    }
    await this.seedIfEmpty();
  };

  Concretando.LocalDatabaseAdapter = LocalDatabaseAdapter;
})(window);
