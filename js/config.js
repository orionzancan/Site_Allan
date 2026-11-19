(function (global) {
  'use strict';

  const Concretando = (global.Concretando = global.Concretando || {});

  const DEFAULT_CONFIG = {
    brandName: 'CONCRETANDO',
    slogan: 'criando laços e casa',
    // 'auto' detecta Vercel/Supabase (/api/health) e usa Banco Local automaticamente se offline ou sem credenciais
    // 'local' força uso exclusivo do Banco de Dados Local (IndexedDB / localStorage)
    // 'api' força uso das APIs Vercel (/api/* -> Supabase)
    dbMode: 'auto',
    apiBaseUrl: '/api',
    whatsappNumber: '5511999999999',
    viaCepUrl: 'https://viacep.com.br/ws',
    pixDiscountPct: 5,
    freeShippingThreshold: 1800
  };

  function loadUserOverrides() {
    try {
      const raw = localStorage.getItem('concretando_config');
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveUserOverrides(partial) {
    try {
      const merged = Object.assign({}, loadUserOverrides(), partial);
      localStorage.setItem('concretando_config', JSON.stringify(merged));
      Object.assign(Concretando.config, merged);
    } catch (_) {
      // Ignora em modo privado restrito
    }
  }

  Concretando.config = Object.assign({}, DEFAULT_CONFIG, loadUserOverrides());
  Concretando.saveConfig = saveUserOverrides;
})(window);
