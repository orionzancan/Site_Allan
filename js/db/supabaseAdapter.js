(function (global) {
  'use strict';

  const Concretando = (global.Concretando = global.Concretando || {});

  function SupabaseApiAdapter(baseUrl) {
    this.baseUrl = (baseUrl || '/api').replace(/\/$/, '');
  }

  SupabaseApiAdapter.prototype.request = async function (path, options) {
    const res = await fetch(this.baseUrl + path, Object.assign({
      headers: { 'Content-Type': 'application/json' }
    }, options));
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.ok === false) {
      const err = new Error(json.error || json.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.code = json.code;
      throw err;
    }
    return json;
  };

  SupabaseApiAdapter.prototype.checkHealth = async function () {
    if (window.location.protocol === 'file:') {
      return { available: false, reason: 'file_protocol' };
    }
    try {
      const res = await this.request('/health', { method: 'GET' });
      return {
        available: res.database === 'supabase',
        apiOnline: true,
        database: res.database,
        details: res
      };
    } catch (err) {
      return { available: false, apiOnline: false, reason: err.message };
    }
  };

  SupabaseApiAdapter.prototype.getProducts = async function () {
    const res = await this.request('/products', { method: 'GET' });
    return res.data || [];
  };

  SupabaseApiAdapter.prototype.saveProduct = async function (product) {
    const res = await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return res.data;
  };

  SupabaseApiAdapter.prototype.getStores = async function () {
    const res = await this.request('/stores', { method: 'GET' });
    return res.data || [];
  };

  SupabaseApiAdapter.prototype.getQuotes = async function () {
    const res = await this.request('/quotes', { method: 'GET' });
    return res.data || [];
  };

  SupabaseApiAdapter.prototype.createQuote = async function (quote) {
    const res = await this.request('/quotes', {
      method: 'POST',
      body: JSON.stringify(quote)
    });
    return res.data;
  };

  SupabaseApiAdapter.prototype.getOrders = async function () {
    const res = await this.request('/orders', { method: 'GET' });
    return res.data || [];
  };

  SupabaseApiAdapter.prototype.createOrder = async function (order) {
    const res = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    return res.data;
  };

  SupabaseApiAdapter.prototype.createContact = async function (message) {
    const res = await this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(message)
    });
    return res.data;
  };

  Concretando.SupabaseApiAdapter = SupabaseApiAdapter;
})(window);
