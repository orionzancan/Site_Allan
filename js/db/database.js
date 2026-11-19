(function (global) {
  'use strict';

  const Concretando = (global.Concretando = global.Concretando || {});

  function DatabaseRepository() {
    this.local = new Concretando.LocalDatabaseAdapter();
    this.remote = new Concretando.SupabaseApiAdapter(Concretando.config.apiBaseUrl);
    this.activeSource = 'local';
    this.localEngine = 'IndexedDB';
    this.healthInfo = null;
  }

  DatabaseRepository.prototype.init = async function () {
    this.localEngine = await this.local.init();
    const desiredMode = Concretando.config.dbMode || 'auto';

    if (desiredMode === 'local') {
      this.activeSource = 'local';
      return this.getStatus();
    }

    const health = await this.remote.checkHealth();
    this.healthInfo = health;

    if (health.available) {
      this.activeSource = 'supabase';
    } else {
      this.activeSource = 'local';
    }
    return this.getStatus();
  };

  DatabaseRepository.prototype.getStatus = function () {
    return {
      activeSource: this.activeSource,
      localEngine: this.localEngine,
      configuredMode: Concretando.config.dbMode,
      healthInfo: this.healthInfo
    };
  };

  DatabaseRepository.prototype.getProducts = async function () {
    if (this.activeSource === 'supabase') {
      try {
        const remoteProducts = await this.remote.getProducts();
        if (remoteProducts.length > 0) return remoteProducts;
      } catch (err) {
        console.warn('[DB] Fallback para Banco Local (getProducts):', err.message);
      }
    }
    return this.local.getAll('products');
  };

  DatabaseRepository.prototype.saveProduct = async function (product) {
    const savedLocal = await this.local.put('products', product);
    if (this.activeSource === 'supabase') {
      try {
        return await this.remote.saveProduct(savedLocal);
      } catch (err) {
        console.warn('[DB] Produto salvo localmente (Supabase indisponível):', err.message);
      }
    }
    return savedLocal;
  };

  DatabaseRepository.prototype.getStores = async function () {
    if (this.activeSource === 'supabase') {
      try {
        const remoteStores = await this.remote.getStores();
        if (remoteStores.length > 0) return remoteStores;
      } catch (err) {
        console.warn('[DB] Fallback para Banco Local (getStores):', err.message);
      }
    }
    return this.local.getAll('stores');
  };

  DatabaseRepository.prototype.getQuotes = async function () {
    if (this.activeSource === 'supabase') {
      try {
        return await this.remote.getQuotes();
      } catch (err) {
        console.warn('[DB] Fallback para Banco Local (getQuotes):', err.message);
      }
    }
    const list = await this.local.getAll('quotes');
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  DatabaseRepository.prototype.createQuote = async function (quotePayload) {
    const record = Object.assign({
      quote_code: `COT-${Date.now().toString(36).toUpperCase()}`,
      status: 'aberta',
      created_at: new Date().toISOString()
    }, quotePayload);

    const savedLocal = await this.local.put('quotes', record);
    if (this.activeSource === 'supabase') {
      try {
        return await this.remote.createQuote(record);
      } catch (err) {
        console.warn('[DB] Cotação salva localmente:', err.message);
      }
    }
    return savedLocal;
  };

  DatabaseRepository.prototype.getOrders = async function () {
    if (this.activeSource === 'supabase') {
      try {
        return await this.remote.getOrders();
      } catch (err) {
        console.warn('[DB] Fallback para Banco Local (getOrders):', err.message);
      }
    }
    const list = await this.local.getAll('orders');
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  DatabaseRepository.prototype.createOrder = async function (orderPayload) {
    const fulfillment = orderPayload.fulfillment_type === 'delivery' ? 'delivery' : 'pickup';
    const record = Object.assign({
      order_code: `PED-${Date.now().toString(36).toUpperCase()}`,
      pickup_code: fulfillment === 'pickup' ? `RET-${Math.floor(100000 + Math.random() * 900000)}` : null,
      status: fulfillment === 'pickup' ? 'separacao' : 'confirmado',
      created_at: new Date().toISOString()
    }, orderPayload);

    const savedLocal = await this.local.put('orders', record);
    if (this.activeSource === 'supabase') {
      try {
        return await this.remote.createOrder(record);
      } catch (err) {
        console.warn('[DB] Pedido salvo localmente:', err.message);
      }
    }
    return savedLocal;
  };

  DatabaseRepository.prototype.createContact = async function (contactPayload) {
    const savedLocal = await this.local.put('contacts', Object.assign({ status: 'nova' }, contactPayload));
    if (this.activeSource === 'supabase') {
      try {
        return await this.remote.createContact(contactPayload);
      } catch (err) {
        console.warn('[DB] Contato salvo localmente:', err.message);
      }
    }
    return savedLocal;
  };

  DatabaseRepository.prototype.getContacts = async function () {
    return this.local.getAll('contacts');
  };

  DatabaseRepository.prototype.registerUser = async function (user) {
    const users = await this.local.getAll('users');
    const existing = users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (existing) {
      return existing;
    }
    return this.local.put('users', {
      id: `usr-${Date.now().toString(36)}`,
      name: user.name,
      email: user.email.toLowerCase(),
      phone: user.phone || '',
      document: user.document || ''
    });
  };

  DatabaseRepository.prototype.findUserByEmail = async function (email) {
    const users = await this.local.getAll('users');
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  };

  Concretando.db = new DatabaseRepository();
})(window);
