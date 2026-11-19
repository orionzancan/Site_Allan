(function (global) {
  'use strict';

  const C = global.Concretando;
  const { formatBRL, quoteCalculator, apiClient } = C;

  const state = {
    products: [],
    stores: [],
    quotes: [],
    orders: [],
    cart: loadJson('concretando_cart', []),
    favorites: loadJson('concretando_favorites', []),
    currentUser: loadJson('concretando_user', null),
    selectedStoreId: 'loja-matriz',
    activeCategory: 'todos',
    promoOnly: false,
    searchQuery: '',
    sortBy: 'promo',
    calcMode: 'dimensions',
    lastQuoteResult: null,
    checkoutFulfillment: 'pickup',
    shippingEstimate: { cost: 0, days: 'Retirada em até 2h' }
  };

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {}
  }

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message, type = 'info') {
    const container = $('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type === 'success' ? 'success' : ''}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 220);
    }, 3400);
  }

  /* ===========================
     INICIALIZAÇÃO
     =========================== */
  async function init() {
    const status = await C.db.init();
    updateDbStatusUI(status);

    await refreshAllData();
    initDefaultPickupDate();
    populatePickupSlots();
    bindEvents();
    updateHeaderUser();
    updateBadges();
    recalculateM2();
  }

  async function refreshAllData() {
    const [products, stores, quotes, orders] = await Promise.all([
      C.db.getProducts(),
      C.db.getStores(),
      C.db.getQuotes(),
      C.db.getOrders()
    ]);

    state.products = products;
    state.stores = stores;
    state.quotes = quotes;
    state.orders = orders;

    renderCategoryTabs();
    renderProducts();
    populateCalculatorSelects();
    renderStores();
    renderQuotesTab();
    renderOrdersTab();
    renderCart();
  }

  function updateDbStatusUI(status) {
    const label = status.activeSource === 'supabase'
      ? 'Supabase Cloud (Vercel API)'
      : `Banco Local (${status.localEngine})`;
    $('dbStatusText').textContent = label;
    $('dbDetailsText').innerHTML =
      status.activeSource === 'supabase'
        ? `<strong>Modo Produção Ativo:</strong> Conectado ao PostgreSQL no <strong>Supabase</strong> via Vercel Serverless Functions (<code>/api/*</code>).`
        : `<strong>Modo Local Ativo (${escapeHtml(status.localEngine)}):</strong> Todos os produtos, cotações por m², pedidos e mensagens estão persistidos localmente no navegador com fallback automático. Ao publicar na Vercel com as variáveis do Supabase, o sistema sincroniza automaticamente na nuvem.`;
  }

  function initDefaultPickupDate() {
    const dateInput = $('checkoutPickupDate');
    if (!dateInput) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    dateInput.min = iso;
    dateInput.value = iso;
  }

  function populatePickupSlots() {
    const sel = $('checkoutPickupSlot');
    if (!sel) return;
    sel.innerHTML = C.seed.PICKUP_SLOTS
      .map((slot) => `<option value="${escapeHtml(slot)}">${escapeHtml(slot)}</option>`)
      .join('');
  }

  /* ===========================
     CATÁLOGO & FILTROS
     =========================== */
  function renderCategoryTabs() {
    const container = $('categoryTabs');
    container.innerHTML = C.seed.CATEGORIES.map((cat) => `
      <button type="button" class="cat-tab ${state.activeCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
        ${escapeHtml(cat.label)}
      </button>
    `).join('');
  }

  function getFilteredProducts() {
    const q = state.searchQuery.trim().toLowerCase();
    let list = state.products.filter((p) => {
      if (state.activeCategory !== 'todos' && p.category !== state.activeCategory) return false;
      if (state.promoOnly && !p.is_promo) return false;
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.category} ${p.short_description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (state.sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (state.sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (state.sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => Number(b.is_promo) - Number(a.is_promo));

    return list;
  }

  function renderProducts() {
    const grid = $('productsGrid');
    const list = getFilteredProducts();

    if (list.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Nenhum material encontrado para este filtro. Tente limpar a busca.</div>`;
      return;
    }

    grid.innerHTML = list.map((p) => {
      const isFav = state.favorites.includes(p.id);
      return `
        <article class="product-card">
          <div class="product-media">
            <img src="${escapeHtml(p.image_url || 'assets/images/hero-warehouse.jpg')}" alt="${escapeHtml(p.name)}" loading="lazy" />
            ${p.is_promo && p.promo_badge ? `<span class="promo-tag">${escapeHtml(p.promo_badge)}</span>` : ''}
            <button class="fav-toggle ${isFav ? 'active' : ''}" type="button" data-fav-id="${escapeHtml(p.id)}" aria-label="Favoritar">
              ♥
            </button>
          </div>
          <div class="product-body">
            <div class="product-meta">
              <span>SKU: ${escapeHtml(p.sku)}</span>
              ${p.pickup_ready ? `<span class="pickup-badge">✓ ${escapeHtml(p.pickup_time_label || 'Retire na Loja')}</span>` : ''}
            </div>
            <h3 class="product-title">${escapeHtml(p.name)}</h3>
            <p class="product-desc">${escapeHtml(p.short_description || '')}</p>
            ${p.m2_supported ? `<div class="product-m2-hint">📐 ${escapeHtml(p.m2_application || `Rendimento: ${p.m2_units_per_m2} ${p.unit}/m²`)}</div>` : ''}
            <div class="product-pricing">
              ${p.original_price && p.original_price > p.price ? `<span class="price-old">${formatBRL(p.original_price)}</span>` : ''}
              <div>
                <span class="price-current">${formatBRL(p.price)}</span>
                <span class="price-unit">/ ${escapeHtml(p.unit)}</span>
              </div>
            </div>
            <div class="product-actions">
              <button class="btn btn-primary btn-sm" type="button" data-add-cart="${escapeHtml(p.id)}">
                + Carrinho
              </button>
              <button class="btn btn-outline btn-sm" type="button" data-quote-product="${escapeHtml(p.id)}" title="Cotar este material por m²">
                Cotar m²
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /* ===========================
     CALCULADORA POR METRO QUADRADO
     =========================== */
  function populateCalculatorSelects() {
    const prodSelect = $('calcProductSelect');
    const prevVal = prodSelect.value;
    const m2Products = state.products.filter((p) => p.m2_supported !== false);
    prodSelect.innerHTML = m2Products.map((p) => `
      <option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} — ${formatBRL(p.price)}/${escapeHtml(p.unit)}</option>
    `).join('');
    if (prevVal && m2Products.some((p) => p.id === prevVal)) {
      prodSelect.value = prevVal;
    }

    const storeOptions = state.stores.map((s) => `
      <option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} (${escapeHtml(s.city)}/${escapeHtml(s.state)})</option>
    `).join('');
    $('calcStoreSelect').innerHTML = storeOptions;
    $('checkoutStoreSelect').innerHTML = storeOptions;
    $('calcStoreSelect').value = state.selectedStoreId;
    $('checkoutStoreSelect').value = state.selectedStoreId;
  }

  function recalculateM2() {
    const productId = $('calcProductSelect').value;
    const product = state.products.find((p) => p.id === productId) || state.products[0];
    if (!product) return;

    const lossPct = Number($('calcLossInput').value || 10);
    $('calcLossLabel').textContent = `${lossPct}%`;

    try {
      const result = quoteCalculator.calculateM2Quote({
        product,
        mode: state.calcMode,
        width: $('calcWidth').value,
        length: $('calcLength').value,
        directArea: $('calcDirectArea').value,
        lossPct
      });

      state.lastQuoteResult = result;
      $('calcSelectedTitle').textContent = result.product_name;
      $('calcAppHint').textContent = result.application;
      $('resArea').textContent = `${result.area_m2} m²`;
      $('resAreaLoss').textContent = `${result.total_area_with_loss} m² (+${result.loss_pct}%)`;
      $('resQty').textContent = `${result.calculated_quantity} ${result.unit}`;
      $('resPriceM2').textContent = `${formatBRL(result.price_per_m2)} / m²`;
      $('resTotal').textContent = formatBRL(result.estimated_total);
      $('resPix').textContent = `${formatBRL(result.pix_total)} no PIX (${C.config.pixDiscountPct}% OFF)`;
    } catch (err) {
      state.lastQuoteResult = null;
      $('resQty').textContent = '—';
      $('resTotal').textContent = 'Informe medidas válidas';
      $('resPix').textContent = err.message;
    }
  }

  /* ===========================
     UNIDADES DE RETIRADA NA LOJA
     =========================== */
  function renderStores() {
    const grid = $('storesGrid');
    grid.innerHTML = state.stores.map((s) => {
      const selected = s.id === state.selectedStoreId;
      return `
        <article class="store-card ${selected ? 'selected' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <h3>${escapeHtml(s.name)}</h3>
            ${selected ? '<span class="pickup-badge">Selecionada</span>' : ''}
          </div>
          <div class="store-info-line">📍 ${escapeHtml(s.address)} — ${escapeHtml(s.city)}/${escapeHtml(s.state)} (CEP ${escapeHtml(s.cep)})</div>
          <div class="store-info-line">🕒 ${escapeHtml(s.hours)} • ☎ ${escapeHtml(s.phone)}</div>
          <div class="store-dock">🚚 ${escapeHtml(s.pickup_dock_info || 'Doca de retirada rápida')}</div>
          <button type="button" class="btn ${selected ? 'btn-primary' : 'btn-outline'} btn-sm" data-select-store="${escapeHtml(s.id)}">
            ${selected ? 'Unidade Ativa para Retirada' : 'Escolher esta Loja para Retirada'}
          </button>
        </article>
      `;
    }).join('');
  }

  /* ===========================
     CARRINHO & CHECKOUT
     =========================== */
  function addToCart(productId, qty = 1, metaNote = '') {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;

    const existing = state.cart.find((item) => item.product_id === productId);
    if (existing) {
      existing.quantity += Number(qty);
      if (metaNote) existing.note = metaNote;
    } else {
      state.cart.push({
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        price: Number(product.price),
        image_url: product.image_url,
        quantity: Number(qty),
        note: metaNote
      });
    }

    saveJson('concretando_cart', state.cart);
    updateBadges();
    renderCart();
    showToast(`Adicionado: ${qty} ${product.unit} de ${product.name}`, 'success');
  }

  function updateCartQty(productId, newQty) {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) {
      state.cart = state.cart.filter((i) => i.product_id !== productId);
    } else {
      const item = state.cart.find((i) => i.product_id === productId);
      if (item) item.quantity = qty;
    }
    saveJson('concretando_cart', state.cart);
    updateBadges();
    renderCart();
  }

  function getCartTotals(paymentMethod = 'pix') {
    const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = state.checkoutFulfillment === 'pickup'
      ? 0
      : (subtotal > 0 ? apiClient.estimateShipping($('checkoutCep')?.value, subtotal).cost : 0);
    const discount = paymentMethod === 'pix'
      ? Number((subtotal * ((C.config.pixDiscountPct || 5) / 100)).toFixed(2))
      : 0;
    const total = Math.max(0, Number((subtotal + shipping - discount).toFixed(2)));
    return { subtotal, shipping, discount, total };
  }

  function renderCart() {
    const container = $('cartItemsContainer');
    const summaryBox = $('cartSummaryBox');

    if (state.cart.length === 0) {
      container.innerHTML = `<div class="empty-state">Seu carrinho está vazio.<br/>Adicione materiais pelo catálogo ou pela calculadora de m².</div>`;
      summaryBox.innerHTML = '';
      $('btnProceedCheckout').disabled = true;
      return;
    }

    $('btnProceedCheckout').disabled = false;
    container.innerHTML = state.cart.map((item) => `
      <div class="cart-item">
        <img src="${escapeHtml(item.image_url || 'assets/images/hero-warehouse.jpg')}" alt="${escapeHtml(item.name)}" />
        <div>
          <strong style="font-size:0.9rem;display:block;line-height:1.25;">${escapeHtml(item.name)}</strong>
          <span style="font-size:0.78rem;color:var(--text-secondary);">${formatBRL(item.price)} / ${escapeHtml(item.unit)}</span>
          ${item.note ? `<div style="font-size:0.73rem;color:#fca5a5;">${escapeHtml(item.note)}</div>` : ''}
          <div class="qty-stepper">
            <button type="button" data-qty-dec="${escapeHtml(item.product_id)}">-</button>
            <input type="number" min="1" value="${item.quantity}" data-qty-input="${escapeHtml(item.product_id)}" />
            <button type="button" data-qty-inc="${escapeHtml(item.product_id)}">+</button>
          </div>
        </div>
        <div style="text-align:right;">
          <strong style="font-size:0.92rem;display:block;">${formatBRL(item.price * item.quantity)}</strong>
          <button type="button" class="btn btn-ghost btn-sm" style="padding:4px 6px;font-size:0.75rem;color:#fca5a5;" data-remove-cart="${escapeHtml(item.product_id)}">Remover</button>
        </div>
      </div>
    `).join('');

    const totals = getCartTotals('cartao');
    summaryBox.innerHTML = `
      <div class="summary-line"><span>Subtotal</span><strong>${formatBRL(totals.subtotal)}</strong></div>
      <div class="summary-line">
        <span>${state.checkoutFulfillment === 'pickup' ? 'Retirada na Loja' : 'Frete Estimado'}</span>
        <strong style="color:${totals.shipping === 0 ? '#4ade80' : '#fff'};">${totals.shipping === 0 ? 'GRÁTIS' : formatBRL(totals.shipping)}</strong>
      </div>
      <div class="summary-line total"><span>Total</span><span>${formatBRL(totals.total)}</span></div>
      <div style="font-size:0.78rem;color:#4ade80;text-align:right;">No PIX: ${formatBRL(getCartTotals('pix').total)} (5% OFF)</div>
    `;
  }

  function updateCheckoutModalPreview() {
    const payment = $('orderPaymentMethod').value;
    const totals = getCartTotals(payment);
    const store = state.stores.find((s) => s.id === $('checkoutStoreSelect').value);
    const modeLabel = state.checkoutFulfillment === 'pickup'
      ? `Retirada Grátis — ${store ? store.name : 'Unidade Matriz'} (${$('checkoutPickupDate').value || 'Hoje'}, ${$('checkoutPickupSlot').value})`
      : `Entrega na Obra — ${$('checkoutAddress').value || 'Endereço informado'} (${$('checkoutCity').value || ''}/${$('checkoutState').value || ''})`;

    $('checkoutFinalPreview').innerHTML = `
      <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:6px;">${escapeHtml(modeLabel)}</div>
      <div class="summary-line"><span>Subtotal (${state.cart.length} itens)</span><strong>${formatBRL(totals.subtotal)}</strong></div>
      <div class="summary-line"><span>Frete / Retirada</span><strong>${totals.shipping === 0 ? 'GRÁTIS' : formatBRL(totals.shipping)}</strong></div>
      ${totals.discount > 0 ? `<div class="summary-line" style="color:#4ade80;"><span>Desconto PIX (5%)</span><strong>- ${formatBRL(totals.discount)}</strong></div>` : ''}
      <div class="summary-line total"><span>Total Final</span><span>${formatBRL(totals.total)}</span></div>
    `;
  }

  /* ===========================
     CENTRAL OPERACIONAL (COTAÇÕES & PEDIDOS)
     =========================== */
  function renderQuotesTab() {
    $('countQuotesTab').textContent = state.quotes.length;
    const el = $('opsTabQuotes');
    if (state.quotes.length === 0) {
      el.innerHTML = `<div class="empty-state">Nenhuma cotação por m² salva ainda. Use a calculadora acima e clique em "Salvar Cotação no Banco".</div>`;
      return;
    }

    el.innerHTML = state.quotes.map((q) => `
      <div class="ops-row">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
            <span class="code-badge">${escapeHtml(q.quote_code || q.id)}</span>
            <strong>${escapeHtml(q.product_name)}</strong>
          </div>
          <div style="font-size:0.83rem;color:var(--text-secondary);">
            Área: <strong>${q.area_m2} m²</strong> (+${q.loss_pct}% perda = ${q.total_area_with_loss} m²) •
            Qtd: <strong>${q.calculated_quantity} ${escapeHtml(q.unit)}</strong> •
            Modalidade: <strong>${q.delivery_mode === 'pickup' ? 'Retirada na Loja' : 'Entrega'}</strong>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <strong style="font-size:1.05rem;">${formatBRL(q.estimated_total)}</strong>
          <button class="btn btn-primary btn-sm" type="button" data-convert-quote="${escapeHtml(q.id || q.quote_code)}">
            Enviar ao Carrinho
          </button>
        </div>
      </div>
    `).join('');
  }

  function renderOrdersTab() {
    $('countOrdersTab').textContent = state.orders.length;
    const el = $('opsTabOrders');
    if (state.orders.length === 0) {
      el.innerHTML = `<div class="empty-state">Nenhum pedido realizado ainda. Finalize seu carrinho para gerar o código de retirada ou entrega.</div>`;
      return;
    }

    el.innerHTML = state.orders.map((o) => `
      <div class="ops-row">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
            <span class="code-badge">${escapeHtml(o.order_code)}</span>
            ${o.pickup_code ? `<span class="pickup-code-pill">CÓDIGO DE RETIRADA: ${escapeHtml(o.pickup_code)}</span>` : '<span class="pickup-badge">ENTREGA NA OBRA</span>'}
          </div>
          <div style="font-size:0.84rem;color:var(--text-secondary);">
            Cliente: <strong>${escapeHtml(o.customer_name)}</strong> •
            ${o.fulfillment_type === 'pickup'
              ? `Retirar em: <strong>${escapeHtml(o.store_name || o.store_id)}</strong> (${escapeHtml(o.pickup_date || 'Agendado')} • ${escapeHtml(o.pickup_slot || '')})`
              : `Entrega: <strong>${escapeHtml(o.delivery_address || '')} - ${escapeHtml(o.delivery_city || '')}/${escapeHtml(o.delivery_state || '')}</strong>`
            }
          </div>
        </div>
        <div style="text-align:right;">
          <strong style="font-size:1.08rem;display:block;">${formatBRL(o.total)}</strong>
          <span style="font-size:0.76rem;color:#4ade80;text-transform:uppercase;">${escapeHtml(o.status || 'confirmado')}</span>
        </div>
      </div>
    `).join('');
  }

  /* ===========================
     FAVORITOS, USUÁRIO & MODAIS
     =========================== */
  function updateBadges() {
    const totalUnits = state.cart.reduce((s, i) => s + Number(i.quantity || 0), 0);
    $('cartCountBadge').textContent = totalUnits;
    $('favCountBadge').textContent = state.favorites.length;
  }

  function updateHeaderUser() {
    const btn = $('btnOpenAuth');
    if (state.currentUser && state.currentUser.name) {
      const firstName = state.currentUser.name.split(' ')[0];
      btn.textContent = `Olá, ${firstName}`;
    } else {
      btn.textContent = 'Entre ou cadastre';
    }
  }

  function renderFavoritesModal() {
    const list = $('favoritesList');
    const favProducts = state.products.filter((p) => state.favorites.includes(p.id));
    if (favProducts.length === 0) {
      list.innerHTML = `<div class="empty-state">Você ainda não favoritou nenhum material. Clique no ícone ♥ nos produtos do catálogo.</div>`;
      return;
    }
    list.innerHTML = favProducts.map((p) => `
      <div class="ops-row">
        <div>
          <strong>${escapeHtml(p.name)}</strong>
          <div style="font-size:0.82rem;color:var(--text-secondary);">${formatBRL(p.price)} / ${escapeHtml(p.unit)}</div>
        </div>
        <button class="btn btn-primary btn-sm" type="button" data-add-cart="${escapeHtml(p.id)}">+ Carrinho</button>
      </div>
    `).join('');
  }

  function closeAllOverlays() {
    $('globalOverlay').classList.remove('open');
    document.querySelectorAll('.drawer.open, .modal.open').forEach((el) => el.classList.remove('open'));
  }

  function openPanel(id) {
    closeAllOverlays();
    $('globalOverlay').classList.add('open');
    $(id).classList.add('open');
  }

  /* ===========================
     EVENTOS
     =========================== */
  function bindEvents() {
    // Fechar overlays
    $('globalOverlay').addEventListener('click', closeAllOverlays);
    document.querySelectorAll('[data-close-all]').forEach((el) => el.addEventListener('click', closeAllOverlays));

    // Botões do header
    $('btnOpenMenu').addEventListener('click', () => openPanel('menuDrawer'));
    $('btnOpenCart').addEventListener('click', () => { renderCart(); openPanel('cartDrawer'); });
    $('btnOpenFavorites').addEventListener('click', () => { renderFavoritesModal(); openPanel('favoritesModal'); });
    $('btnOpenAuth').addEventListener('click', () => openPanel('authModal'));
    $('btnMenuAuth').addEventListener('click', () => openPanel('authModal'));
    $('btnOpenContact').addEventListener('click', () => openPanel('contactModal'));
    $('btnMenuContact').addEventListener('click', () => openPanel('contactModal'));
    $('btnDbStatus').addEventListener('click', () => {
      document.querySelector('[data-ops-tab="dbapi"]').click();
      $('operacao').scrollIntoView({ behavior: 'smooth' });
    });

    // Mosaico lateral (atalho de categoria)
    document.querySelectorAll('[data-quick-category]').forEach((card) => {
      card.addEventListener('click', () => {
        state.activeCategory = card.dataset.quickCategory;
        renderCategoryTabs();
        renderProducts();
        $('catalogo').scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Filtros do catálogo
    $('categoryTabs').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-category]');
      if (!btn) return;
      state.activeCategory = btn.dataset.category;
      renderCategoryTabs();
      renderProducts();
    });

    $('filterPromoOnly').addEventListener('change', (e) => {
      state.promoOnly = e.target.checked;
      renderProducts();
    });

    $('catalogSearch').addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderProducts();
    });

    $('catalogSort').addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderProducts();
    });

    // Ações nos cards de produto (delegação global)
    document.body.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add-cart]');
      if (addBtn) {
        addToCart(addBtn.dataset.addCart, 1);
        return;
      }

      const favBtn = e.target.closest('[data-fav-id]');
      if (favBtn) {
        const id = favBtn.dataset.favId;
        if (state.favorites.includes(id)) {
          state.favorites = state.favorites.filter((x) => x !== id);
        } else {
          state.favorites.push(id);
          showToast('Material salvo nos Favoritos!');
        }
        saveJson('concretando_favorites', state.favorites);
        updateBadges();
        renderProducts();
        return;
      }

      const quoteBtn = e.target.closest('[data-quote-product]');
      if (quoteBtn) {
        $('calcProductSelect').value = quoteBtn.dataset.quoteProduct;
        recalculateM2();
        $('calculadora').scrollIntoView({ behavior: 'smooth' });
        showToast('Material carregado na Calculadora por m²!');
        return;
      }

      const storeBtn = e.target.closest('[data-select-store]');
      if (storeBtn) {
        state.selectedStoreId = storeBtn.dataset.selectStore;
        $('calcStoreSelect').value = state.selectedStoreId;
        $('checkoutStoreSelect').value = state.selectedStoreId;
        renderStores();
        showToast('Unidade de retirada selecionada!', 'success');
        return;
      }

      const convertQuoteBtn = e.target.closest('[data-convert-quote]');
      if (convertQuoteBtn) {
        const key = convertQuoteBtn.dataset.convertQuote;
        const q = state.quotes.find((x) => x.id === key || x.quote_code === key);
        if (q && q.product_id) {
          addToCart(q.product_id, q.calculated_quantity, `Cotação ${q.quote_code} (${q.area_m2} m²)`);
          openPanel('cartDrawer');
        }
        return;
      }
    });

    // Calculadora m²
    $('calcModeToggle').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      state.calcMode = btn.dataset.mode;
      $('calcModeToggle').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      $('calcDimensionsRow').classList.toggle('hidden', state.calcMode !== 'dimensions');
      $('calcAreaRow').classList.toggle('hidden', state.calcMode !== 'area');
      recalculateM2();
    });

    $('lossPills').addEventListener('click', (e) => {
      const pill = e.target.closest('[data-loss]');
      if (!pill) return;
      $('calcLossInput').value = pill.dataset.loss;
      $('lossPills').querySelectorAll('.loss-pill').forEach((p) => p.classList.toggle('active', p === pill));
      recalculateM2();
    });

    ['calcProductSelect', 'calcWidth', 'calcLength', 'calcDirectArea', 'calcLossInput'].forEach((id) => {
      $(id).addEventListener('input', recalculateM2);
      $(id).addEventListener('change', recalculateM2);
    });

    $('calcDeliveryMode').addEventListener('change', (e) => {
      $('calcStoreGroup').classList.toggle('hidden', e.target.value !== 'pickup');
    });

    $('btnAddQuoteToCart').addEventListener('click', () => {
      if (!state.lastQuoteResult) return showToast('Informe medidas válidas primeiro.');
      const r = state.lastQuoteResult;
      addToCart(r.product_id, r.calculated_quantity, `Cotação m²: ${r.area_m2} m² (+${r.loss_pct}% perda)`);
      state.checkoutFulfillment = $('calcDeliveryMode').value;
      syncFulfillmentUI();
      openPanel('cartDrawer');
    });

    $('btnSaveQuoteDb').addEventListener('click', async () => {
      if (!state.lastQuoteResult) return showToast('Informe medidas válidas primeiro.');
      const r = state.lastQuoteResult;
      const saved = await C.db.createQuote(Object.assign({}, r, {
        customer_name: state.currentUser?.name || 'Cliente Visitante',
        customer_email: state.currentUser?.email || null,
        customer_phone: state.currentUser?.phone || null,
        delivery_mode: $('calcDeliveryMode').value,
        store_id: $('calcStoreSelect').value,
        notes: $('calcNotes').value.trim()
      }));
      state.quotes = await C.db.getQuotes();
      renderQuotesTab();
      showToast(`Cotação ${saved.quote_code} salva no Banco de Dados!`, 'success');
    });

    $('btnShareQuoteWhatsApp').addEventListener('click', () => {
      if (!state.lastQuoteResult) return showToast('Calcule a metragem primeiro.');
      const url = apiClient.buildWhatsAppQuoteUrl(Object.assign({}, state.lastQuoteResult, {
        delivery_mode: $('calcDeliveryMode').value
      }));
      window.open(url, '_blank', 'noopener');
    });

    // Carrinho & Fulfillment
    $('cartItemsContainer').addEventListener('click', (e) => {
      const dec = e.target.closest('[data-qty-dec]');
      if (dec) {
        const item = state.cart.find((i) => i.product_id === dec.dataset.qtyDec);
        if (item) updateCartQty(item.product_id, item.quantity - 1);
        return;
      }
      const inc = e.target.closest('[data-qty-inc]');
      if (inc) {
        const item = state.cart.find((i) => i.product_id === inc.dataset.qtyInc);
        if (item) updateCartQty(item.product_id, item.quantity + 1);
        return;
      }
      const rem = e.target.closest('[data-remove-cart]');
      if (rem) updateCartQty(rem.dataset.removeCart, 0);
    });

    $('cartItemsContainer').addEventListener('change', (e) => {
      if (e.target.matches('[data-qty-input]')) {
        updateCartQty(e.target.dataset.qtyInput, e.target.value);
      }
    });

    $('checkoutFulfillmentToggle').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-fulfillment]');
      if (!btn) return;
      state.checkoutFulfillment = btn.dataset.fulfillment;
      syncFulfillmentUI();
      renderCart();
    });

    $('btnLookupCep').addEventListener('click', async () => {
      const cepVal = $('checkoutCep').value;
      const btn = $('btnLookupCep');
      btn.textContent = '...';
      try {
        const info = await apiClient.lookupCep(cepVal);
        $('checkoutAddress').value = info.address;
        $('checkoutCity').value = info.city;
        $('checkoutState').value = info.state;
        renderCart();
        showToast(`Endereço encontrado via ViaCEP: ${info.city}/${info.state}`, 'success');
      } catch (err) {
        showToast(err.message);
      } finally {
        btn.textContent = 'Buscar CEP';
      }
    });

    $('btnProceedCheckout').addEventListener('click', () => {
      if (state.cart.length === 0) return;
      if (state.currentUser) {
        $('orderCustomerName').value = state.currentUser.name || '';
        $('orderCustomerEmail').value = state.currentUser.email || '';
        $('orderCustomerPhone').value = state.currentUser.phone || '';
      }
      updateCheckoutModalPreview();
      openPanel('checkoutModal');
    });

    $('orderPaymentMethod').addEventListener('change', updateCheckoutModalPreview);

    $('confirmOrderForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payment = $('orderPaymentMethod').value;
      const totals = getCartTotals(payment);
      const store = state.stores.find((s) => s.id === $('checkoutStoreSelect').value);

      const savedOrder = await C.db.createOrder({
        customer_name: $('orderCustomerName').value.trim(),
        customer_email: $('orderCustomerEmail').value.trim(),
        customer_phone: $('orderCustomerPhone').value.trim(),
        customer_document: $('orderCustomerDoc').value.trim(),
        fulfillment_type: state.checkoutFulfillment,
        store_id: store?.id || 'loja-matriz',
        store_name: store?.name || 'Concretando Matriz',
        pickup_date: $('checkoutPickupDate').value,
        pickup_slot: $('checkoutPickupSlot').value,
        delivery_cep: $('checkoutCep').value.trim(),
        delivery_address: $('checkoutAddress').value.trim(),
        delivery_city: $('checkoutCity').value.trim(),
        delivery_state: $('checkoutState').value.trim(),
        payment_method: payment,
        subtotal: totals.subtotal,
        shipping_cost: totals.shipping,
        discount: totals.discount,
        total: totals.total,
        items: state.cart
      });

      state.cart = [];
      saveJson('concretando_cart', state.cart);
      updateBadges();
      state.orders = await C.db.getOrders();
      renderCart();
      renderOrdersTab();
      closeAllOverlays();

      document.querySelector('[data-ops-tab="orders"]').click();
      $('operacao').scrollIntoView({ behavior: 'smooth' });

      const msg = savedOrder.pickup_code
        ? `Pedido ${savedOrder.order_code} confirmado! Código de retirada: ${savedOrder.pickup_code}`
        : `Pedido ${savedOrder.order_code} confirmado para entrega!`;
      showToast(msg, 'success');
    });

    // Abas da Central Operacional
    document.querySelectorAll('[data-ops-tab]').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-ops-tab]').forEach((t) => t.classList.toggle('active', t === tab));
        const target = tab.dataset.opsTab;
        $('opsTabQuotes').classList.toggle('hidden', target !== 'quotes');
        $('opsTabOrders').classList.toggle('hidden', target !== 'orders');
        $('opsTabDbApi').classList.toggle('hidden', target !== 'dbapi');
      });
    });

    // Cadastro rápido de produto no Banco de Dados
    $('quickAddProductForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('newProdName').value.trim();
      const category = $('newProdCategory').value;
      const price = Number($('newProdPrice').value);
      const unit = $('newProdUnit').value.trim() || 'un';
      const perM2 = Number($('newProdPerM2').value || 1);

      const newProduct = {
        id: `prod-${Date.now().toString(36)}`,
        sku: `CON-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        category,
        unit,
        price,
        original_price: null,
        is_promo: true,
        promo_badge: 'NOVO',
        stock: 500,
        pickup_ready: true,
        pickup_time_label: 'Retire em 2h',
        m2_supported: true,
        m2_units_per_m2: perM2,
        m2_default_loss_pct: 10,
        m2_application: `Consumo estimado (${perM2} ${unit}/m²)`,
        image_url: 'assets/images/hero-warehouse.jpg',
        short_description: 'Material cadastrado dinamicamente no sistema de banco de dados.'
      };

      await C.db.saveProduct(newProduct);
      await refreshAllData();
      e.target.reset();
      showToast(`Produto "${name}" salvo no Banco de Dados!`, 'success');
    });

    // Exportar / Importar / Resetar Banco Local
    $('btnExportDb').addEventListener('click', async () => {
      const snapshot = await C.db.local.exportSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `concretando-backup-db-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup JSON do Banco Local exportado!', 'success');
    });

    $('inputImportDb').addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await C.db.local.importSnapshot(JSON.parse(text));
        await refreshAllData();
        showToast('Banco de Dados restaurado a partir do JSON!', 'success');
      } catch (err) {
        showToast(`Erro ao importar JSON: ${err.message}`);
      } finally {
        e.target.value = '';
      }
    });

    $('btnResetDb').addEventListener('click', async () => {
      await C.db.local.resetToSeed();
      await refreshAllData();
      showToast('Banco Local restaurado para o catálogo padrão.');
    });

    // Testador de APIs Vercel
    document.querySelectorAll('[data-test-api]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const path = btn.dataset.testApi;
        const out = $('apiTestOutput');
        out.textContent = `Testando GET /api${path}...`;
        if (window.location.protocol === 'file:') {
          out.textContent = JSON.stringify({
            mode: 'local_file_preview',
            endpoint: `/api${path}`,
            info: 'Você abriu o site direto do disco (file://). As Serverless Functions em /api/* ficam ativas automaticamente ao rodar "vercel dev" ou publicar na Vercel.',
            localDbEngine: C.db.localEngine
          }, null, 2);
          return;
        }
        try {
          const res = await apiClient.testEndpoint(path);
          out.textContent = JSON.stringify(res, null, 2);
        } catch (err) {
          out.textContent = JSON.stringify({
            endpoint: `/api${path}`,
            status: 'offline_fallback_local',
            error: err.message
          }, null, 2);
        }
      });
    });

    // Auth Modal
    $('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = await C.db.registerUser({
        name: $('authName').value.trim(),
        email: $('authEmail').value.trim(),
        phone: $('authPhone').value.trim()
      });
      state.currentUser = user;
      saveJson('concretando_user', user);
      updateHeaderUser();
      closeAllOverlays();
      showToast(`Bem-vindo(a), ${user.name}!`, 'success');
    });

    // Contact Modal
    $('contactForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await C.db.createContact({
        name: $('contactName').value.trim(),
        email: $('contactEmail').value.trim(),
        phone: $('contactPhone').value.trim(),
        subject: $('contactSubject').value,
        message: $('contactMessage').value.trim()
      });
      e.target.reset();
      closeAllOverlays();
      showToast('Mensagem enviada e registrada no banco! Retornaremos em breve.', 'success');
    });
  }

  function syncFulfillmentUI() {
    $('checkoutFulfillmentToggle').querySelectorAll('button').forEach((b) => {
      b.classList.toggle('active', b.dataset.fulfillment === state.checkoutFulfillment);
    });
    $('checkoutPickupBox').classList.toggle('hidden', state.checkoutFulfillment !== 'pickup');
    $('checkoutDeliveryBox').classList.toggle('hidden', state.checkoutFulfillment !== 'delivery');
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
