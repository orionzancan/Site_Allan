'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  Download,
  FileSpreadsheet,
  Lock,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Trash2
} from 'lucide-react';
import type {
  ContactMessage,
  OrderRecord,
  OrderStatus,
  Product,
  ProductCategory,
  QuoteRecord,
  SiteSettings,
  StoreLocation
} from '@/types';
import { DEFAULT_SETTINGS, PRODUCT_CATEGORIES } from '@/lib/seed';
import { formatBRL } from '@/lib/format';

interface AdminDashboardProps {
  initialAuthenticated: boolean;
  adminEmail: string;
  dbEngine: 'supabase' | 'local';
}

type AdminTab = 'settings' | 'products' | 'stores' | 'orders' | 'quotes' | 'system';

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'separacao', label: 'Em Separação' },
  { value: 'pronto_retirada', label: 'Pronto para Retirada' },
  { value: 'em_transporte', label: 'Em Transporte' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' }
];

const EMPTY_PRODUCT: Product = {
  id: '',
  sku: '',
  name: '',
  category: 'alvenaria',
  unit: 'un',
  price: 0,
  original_price: null,
  is_promo: false,
  promo_badge: null,
  stock: 100,
  pickup_ready: true,
  pickup_time_label: 'Retire em 2h',
  m2_supported: true,
  m2_units_per_m2: 1,
  m2_default_loss_pct: 10,
  m2_application: 'Aplicação padrão (1 un/m²)',
  image_url: '/images/hero-warehouse.jpg',
  short_description: '',
  active: true
};

const EMPTY_STORE: StoreLocation = {
  id: '',
  name: '',
  address: '',
  city: '',
  state: 'SP',
  cep: '',
  phone: '',
  hours: 'Seg a Sáb: 07h às 19h',
  pickup_dock_info: 'Doca de retirada rápida',
  active: true
};

export function AdminDashboard({ initialAuthenticated, adminEmail, dbEngine }: AdminDashboardProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [currentEmail, setCurrentEmail] = useState(adminEmail);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('admin@concretando.com.br');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Admin State
  const [activeTab, setActiveTab] = useState<AdminTab>('settings');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);

  const [editingProduct, setEditingProduct] = useState<Product>(EMPTY_PRODUCT);
  const [editingStore, setEditingStore] = useState<StoreLocation>(EMPTY_STORE);
  const [apiOutput, setApiOutput] = useState<string>('Clique em um endpoint para testar a resposta JSON.');

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, pRes, stRes, oRes, qRes, cRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/products?all=true'),
        fetch('/api/stores?all=true'),
        fetch('/api/orders'),
        fetch('/api/quotes'),
        fetch('/api/contact')
      ]);

      if (oRes.status === 401) {
        setAuthenticated(false);
        return;
      }

      const [sJson, pJson, stJson, oJson, qJson, cJson] = await Promise.all([
        sRes.json(),
        pRes.json(),
        stRes.json(),
        oRes.json(),
        qRes.json(),
        cRes.json()
      ]);

      if (sJson.data) setSettings(sJson.data);
      if (pJson.data) setProducts(pJson.data);
      if (stJson.data) setStores(stJson.data);
      if (oJson.data) setOrders(oJson.data);
      if (qJson.data) setQuotes(qJson.data);
      if (cJson.data) setContacts(cJson.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadAdminData();
    }
  }, [authenticated, loadAdminData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const json = await res.json();
      if (!res.ok) {
        setLoginError(json.error || 'Credenciais inválidas.');
        return;
      }
      setCurrentEmail(json.admin.email);
      setAuthenticated(true);
      setLoginPassword('');
    } catch {
      setLoginError('Erro de conexão com o servidor.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthenticated(false);
    setCurrentEmail('');
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar.');
      setSettings(json.data);
      notify('Todas as configurações do site foram salvas!');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar produto.');
      setEditingProduct(EMPTY_PRODUCT);
      await loadAdminData();
      notify(`Produto "${json.data.name}" salvo com sucesso!`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Falha ao salvar produto.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadAdminData();
    notify('Produto removido do catálogo.');
  }

  async function handleSaveStore(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStore)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar loja.');
      setEditingStore(EMPTY_STORE);
      await loadAdminData();
      notify(`Unidade "${json.data.name}" salva com sucesso!`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Falha ao salvar loja.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteStore(id: string) {
    await fetch(`/api/stores?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadAdminData();
    notify('Unidade removida.');
  }

  async function handleOrderStatusChange(orderCode: string, status: OrderStatus) {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_code: orderCode, status })
    });
    if (res.ok) {
      await loadAdminData();
      notify(`Status do pedido ${orderCode} atualizado para "${status}".`);
    }
  }

  async function handleExportBackup() {
    const res = await fetch('/api/admin/backup');
    const json = await res.json();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `concretando-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Backup completo JSON exportado!');
  }

  async function handleResetDb() {
    await fetch('/api/admin/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' })
    });
    await loadAdminData();
    notify('Banco local restaurado para os dados padrão.');
  }

  async function handleTestApi(endpoint: string) {
    setApiOutput(`Consultando GET ${endpoint}...`);
    const started = performance.now();
    const res = await fetch(endpoint);
    const elapsed = Math.round(performance.now() - started);
    const data = await res.json().catch(() => ({}));
    setApiOutput(JSON.stringify({ endpoint, status: res.status, elapsedMs: elapsed, data }, null, 2));
  }

  /* ==================== TELA DE LOGIN RESTRITA ==================== */
  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-brand/50 bg-obsidian-850 p-6 shadow-2xl sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-brand/50 bg-brand/15 text-brand">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-wider text-white">
              Área Exclusiva do Administrador
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Autenticação protegida por cookie HTTP-Only assinado no servidor Node.js.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-400">E-mail do Administrador</label>
              <input
                required
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="input-dark"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-400">Senha de Acesso</label>
              <input
                required
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Digite a senha do administrador"
                className="input-dark"
              />
            </div>

            {loginError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                {loginError}
              </div>
            )}

            <button type="submit" disabled={loggingIn} className="btn-brand w-full py-3">
              <ShieldCheck className="h-4 w-4" />
              {loggingIn ? 'Verificando...' : 'Entrar no Painel Admin'}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-white/10 bg-obsidian-900 p-3 text-[11px] text-zinc-400">
            <strong className="text-zinc-200">Credenciais padrão (Ambiente Local):</strong>
            <br />
            E-mail: <code>admin@concretando.com.br</code>
            <br />
            Senha: <code>Concretando@2026</code>
            <br />
            Altere via <code>ADMIN_EMAIL</code> e <code>ADMIN_PASSWORD</code> na Vercel.
          </div>

          <div className="mt-5 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para a loja
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ==================== PAINEL DO ADMINISTRADOR ==================== */
  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'settings', label: 'Configurações do Site', icon: <Settings className="h-4 w-4" /> },
    { id: 'products', label: 'Produtos', icon: <Package className="h-4 w-4" />, count: products.length },
    { id: 'stores', label: 'Lojas (Retirada)', icon: <MapPin className="h-4 w-4" />, count: stores.length },
    { id: 'orders', label: 'Pedidos', icon: <ShoppingBag className="h-4 w-4" />, count: orders.length },
    { id: 'quotes', label: 'Cotações & Contatos', icon: <FileSpreadsheet className="h-4 w-4" />, count: quotes.length + contacts.length },
    { id: 'system', label: 'Banco & APIs', icon: <Database className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Topbar Admin */}
      <header className="sticky top-0 z-30 border-b border-brand/50 bg-[#0c0c10]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold uppercase tracking-wider text-white sm:text-xl">
                Painel Admin — {settings.brand_name}
              </h1>
              <p className="text-[11px] text-zinc-400">
                Logado como {currentEmail} • Banco: {dbEngine === 'supabase' ? 'Supabase PostgreSQL' : 'Local Node.js JSON'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="btn-outline-dark px-3 py-2 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Ver Loja
            </Link>
            <button type="button" onClick={loadAdminData} className="btn-outline-dark px-3 py-2 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </button>
            <button type="button" onClick={handleLogout} className="btn-brand px-3 py-2 text-xs">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Navegação por Abas (Responsiva: scroll horizontal no mobile, barra completa no desktop) */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
                activeTab === tab.id
                  ? 'border-brand bg-brand text-white shadow-lg'
                  : 'border-white/10 bg-obsidian-800 text-zinc-300 hover:border-brand/50 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-[11px]">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ==================== ABA 1: TODAS AS CONFIGURAÇÕES DO SITE ==================== */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Identidade & Hero */}
              <div className="card-surface space-y-4 p-5 sm:p-6">
                <h2 className="text-base font-bold text-white">Identidade Visual &amp; Banner Principal</h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Nome da Loja</label>
                    <input
                      value={settings.brand_name}
                      onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Slogan</label>
                    <input
                      value={settings.slogan}
                      onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Cor Principal da Marca</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primary_color}
                        onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                        className="h-10 w-14 cursor-pointer rounded border border-white/15 bg-transparent"
                      />
                      <input
                        value={settings.primary_color}
                        onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                        className="input-dark"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Texto do Botão Principal (Hero)</label>
                    <input
                      value={settings.hero_cta_label}
                      onChange={(e) => setSettings({ ...settings, hero_cta_label: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Faixa Superior de Promoções</label>
                  <input
                    value={settings.promo_ribbon_text}
                    onChange={(e) => setSettings({ ...settings, promo_ribbon_text: e.target.value })}
                    className="input-dark"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Selinho / Destaque Hero</label>
                  <input
                    value={settings.hero_eyebrow}
                    onChange={(e) => setSettings({ ...settings, hero_eyebrow: e.target.value })}
                    className="input-dark"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Título Principal (Hero)</label>
                  <input
                    value={settings.hero_title}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                    className="input-dark"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Subtítulo / Descrição (Hero)</label>
                  <textarea
                    rows={3}
                    value={settings.hero_subtitle}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                    className="input-dark"
                  />
                </div>
              </div>

              {/* Comercial, Frete, Contato & Operação */}
              <div className="card-surface space-y-4 p-5 sm:p-6">
                <h2 className="text-base font-bold text-white">Regras Comerciais, Frete, Contato &amp; Operação</h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Desconto PIX (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={30}
                      value={settings.pix_discount_pct}
                      onChange={(e) => setSettings({ ...settings, pix_discount_pct: Number(e.target.value) })}
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Frete Grátis a partir de (R$)</label>
                    <input
                      type="number"
                      step="50"
                      min={0}
                      value={settings.free_shipping_threshold}
                      onChange={(e) => setSettings({ ...settings, free_shipping_threshold: Number(e.target.value) })}
                      className="input-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Frete Frota Própria SP (R$)</label>
                    <input
                      type="number"
                      step="1"
                      min={0}
                      value={settings.shipping_capital_fee}
                      onChange={(e) => setSettings({ ...settings, shipping_capital_fee: Number(e.target.value) })}
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Frete Outras Regiões (R$)</label>
                    <input
                      type="number"
                      step="1"
                      min={0}
                      value={settings.shipping_other_fee}
                      onChange={(e) => setSettings({ ...settings, shipping_other_fee: Number(e.target.value) })}
                      className="input-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">WhatsApp (DDI+DDD+Num)</label>
                    <input
                      value={settings.whatsapp_number}
                      onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Telefone</label>
                    <input
                      value={settings.contact_phone}
                      onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">E-mail Comercial</label>
                    <input
                      value={settings.contact_email}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Webhook Externo para Pedidos/Cotações (ERP/n8n/CRM)</label>
                  <input
                    value={settings.webhook_url || ''}
                    onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                    placeholder="https://seu-erp.com/webhooks/concretando"
                    className="input-dark"
                  />
                </div>

                <div className="space-y-2.5 rounded-xl border border-white/10 bg-obsidian-900 p-4 text-sm">
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span>Habilitar Retirada Grátis na Loja</span>
                    <input
                      type="checkbox"
                      checked={settings.pickup_enabled}
                      onChange={(e) => setSettings({ ...settings, pickup_enabled: e.target.checked })}
                      className="h-4 w-4 accent-brand"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span>Habilitar Entrega na Obra (Frete)</span>
                    <input
                      type="checkbox"
                      checked={settings.delivery_enabled}
                      onChange={(e) => setSettings({ ...settings, delivery_enabled: e.target.checked })}
                      className="h-4 w-4 accent-brand"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between gap-3 text-amber-300">
                    <span>Modo Manutenção (oculta a vitrine para clientes)</span>
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                      className="h-4 w-4 accent-brand"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-brand px-6 py-3">
                <Save className="h-4 w-4" />
                {saving ? 'Salvando alterações...' : 'Salvar Todas as Configurações'}
              </button>
            </div>
          </form>
        )}

        {/* ==================== ABA 2: PRODUTOS (CRUD) ==================== */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <form onSubmit={handleSaveProduct} className="card-surface space-y-3 p-5 lg:col-span-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  {editingProduct.id ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                {editingProduct.id && (
                  <button
                    type="button"
                    onClick={() => setEditingProduct(EMPTY_PRODUCT)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <input
                required
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                placeholder="Nome do material"
                className="input-dark"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={editingProduct.sku}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  placeholder="SKU (ex: CON-001)"
                  className="input-dark"
                />
                <select
                  value={editingProduct.category}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })
                  }
                  className="input-dark"
                >
                  {PRODUCT_CATEGORIES.filter((c) => c.id !== 'todos').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">Preço (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">Unidade</label>
                  <input
                    required
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    placeholder="un, sc, m²"
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">Estoque</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="input-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">Consumo por m²</label>
                  <input
                    type="number"
                    step="0.05"
                    value={editingProduct.m2_units_per_m2}
                    onChange={(e) => setEditingProduct({ ...editingProduct, m2_units_per_m2: Number(e.target.value) })}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">Etiqueta Promo</label>
                  <input
                    value={editingProduct.promo_badge || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        promo_badge: e.target.value || null,
                        is_promo: Boolean(e.target.value)
                      })
                    }
                    placeholder="Ex: -15% OFERTA"
                    className="input-dark"
                  />
                </div>
              </div>

              <input
                value={editingProduct.m2_application}
                onChange={(e) => setEditingProduct({ ...editingProduct, m2_application: e.target.value })}
                placeholder="Aplicação m² (ex: Alvenaria 25 un/m²)"
                className="input-dark"
              />

              <input
                value={editingProduct.image_url}
                onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                placeholder="URL da imagem (ex: /images/cat-tijolos.jpg)"
                className="input-dark"
              />

              <textarea
                rows={2}
                value={editingProduct.short_description}
                onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
                placeholder="Descrição curta"
                className="input-dark"
              />

              <button type="submit" disabled={saving} className="btn-brand w-full">
                <Plus className="h-4 w-4" />
                {editingProduct.id ? 'Atualizar Produto' : 'Cadastrar Produto'}
              </button>
            </form>

            <div className="card-surface p-5 lg:col-span-7">
              <h2 className="mb-4 text-base font-bold text-white">Catálogo Cadastrado ({products.length})</h2>
              <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-obsidian-900 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{p.name}</p>
                        <p className="text-xs text-zinc-400">
                          {formatBRL(p.price)}/{p.unit} • Estoque: {p.stock} • {p.m2_units_per_m2} {p.unit}/m²
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(p)}
                        className="btn-outline-dark px-2.5 py-1.5 text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ABA 3: UNIDADES DE RETIRADA (CRUD) ==================== */}
        {activeTab === 'stores' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <form onSubmit={handleSaveStore} className="card-surface space-y-3 p-5 lg:col-span-5">
              <h2 className="text-base font-bold text-white">
                {editingStore.id ? 'Editar Unidade' : 'Nova Unidade de Retirada'}
              </h2>
              <input
                required
                value={editingStore.name}
                onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                placeholder="Nome da unidade"
                className="input-dark"
              />
              <input
                required
                value={editingStore.address}
                onChange={(e) => setEditingStore({ ...editingStore, address: e.target.value })}
                placeholder="Endereço completo"
                className="input-dark"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  required
                  value={editingStore.city}
                  onChange={(e) => setEditingStore({ ...editingStore, city: e.target.value })}
                  placeholder="Cidade"
                  className="input-dark col-span-2"
                />
                <input
                  required
                  maxLength={2}
                  value={editingStore.state}
                  onChange={(e) => setEditingStore({ ...editingStore, state: e.target.value })}
                  placeholder="UF"
                  className="input-dark"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={editingStore.cep}
                  onChange={(e) => setEditingStore({ ...editingStore, cep: e.target.value })}
                  placeholder="CEP"
                  className="input-dark"
                />
                <input
                  value={editingStore.phone}
                  onChange={(e) => setEditingStore({ ...editingStore, phone: e.target.value })}
                  placeholder="Telefone"
                  className="input-dark"
                />
              </div>
              <input
                value={editingStore.hours}
                onChange={(e) => setEditingStore({ ...editingStore, hours: e.target.value })}
                placeholder="Horário de funcionamento"
                className="input-dark"
              />
              <input
                value={editingStore.pickup_dock_info}
                onChange={(e) => setEditingStore({ ...editingStore, pickup_dock_info: e.target.value })}
                placeholder="Info da doca de retirada"
                className="input-dark"
              />
              <button type="submit" disabled={saving} className="btn-brand w-full">
                <Save className="h-4 w-4" /> Salvar Unidade
              </button>
            </form>

            <div className="card-surface p-5 lg:col-span-7 space-y-3">
              <h2 className="text-base font-bold text-white">Unidades Cadastradas ({stores.length})</h2>
              {stores.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-obsidian-900 p-4"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{s.name}</p>
                    <p className="text-xs text-zinc-400">
                      {s.address} — {s.city}/{s.state} • {s.hours}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingStore(s)}
                      className="btn-outline-dark px-2.5 py-1.5 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStore(s.id)}
                      className="rounded-lg border border-red-500/40 bg-red-500/10 p-1.5 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== ABA 4: PEDIDOS & RETIRADAS ==================== */}
        {activeTab === 'orders' && (
          <div className="card-surface p-5 space-y-3">
            <h2 className="text-base font-bold text-white">Pedidos Registrados ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhum pedido registrado ainda.</p>
            ) : (
              orders.map((o) => (
                <div
                  key={o.order_code}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-obsidian-900 p-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-brand/20 px-2 py-0.5 font-mono text-xs font-bold text-red-300">
                        {o.order_code}
                      </span>
                      {o.pickup_code && (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-bold text-emerald-300">
                          RETIRADA: {o.pickup_code}
                        </span>
                      )}
                      <strong className="text-sm text-white">{o.customer_name}</strong>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {o.customer_email} • {o.customer_phone} •{' '}
                      {o.fulfillment_type === 'pickup'
                        ? `Retirar em: ${o.store_name} (${o.pickup_date} • ${o.pickup_slot})`
                        : `Entrega: ${o.delivery_address} - ${o.delivery_city}/${o.delivery_state}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <strong className="text-base text-white">{formatBRL(o.total)}</strong>
                    <select
                      value={o.status}
                      onChange={(e) => handleOrderStatusChange(o.order_code, e.target.value as OrderStatus)}
                      className="input-dark w-44 text-xs"
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== ABA 5: COTAÇÕES m² & MENSAGENS ==================== */}
        {activeTab === 'quotes' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card-surface p-5 space-y-3">
              <h2 className="text-base font-bold text-white">Cotações por m² ({quotes.length})</h2>
              {quotes.length === 0 ? (
                <p className="text-sm text-zinc-400">Nenhuma cotação registrada ainda.</p>
              ) : (
                quotes.map((q) => (
                  <div key={q.quote_code} className="rounded-xl border border-white/10 bg-obsidian-900 p-3.5 text-xs">
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-red-300">{q.quote_code}</span>
                      <strong className="text-white">{formatBRL(q.estimated_total)}</strong>
                    </div>
                    <p className="mt-1 font-semibold text-white">{q.product_name}</p>
                    <p className="text-zinc-400">
                      {q.area_m2} m² (+{q.loss_pct}%) → {q.calculated_quantity} {q.unit} •{' '}
                      {q.delivery_mode === 'pickup' ? 'Retirada na Loja' : 'Entrega'}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="card-surface p-5 space-y-3">
              <h2 className="text-base font-bold text-white">Mensagens de Contato ({contacts.length})</h2>
              {contacts.length === 0 ? (
                <p className="text-sm text-zinc-400">Nenhuma mensagem recebida ainda.</p>
              ) : (
                contacts.map((m, idx) => (
                  <div key={m.id || idx} className="rounded-xl border border-white/10 bg-obsidian-900 p-3.5 text-xs">
                    <p className="font-bold text-white">
                      {m.name} — <span className="text-red-300">{m.subject}</span>
                    </p>
                    <p className="text-zinc-400">
                      {m.email} {m.phone ? `• ${m.phone}` : ''}
                    </p>
                    <p className="mt-2 text-zinc-200">{m.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== ABA 6: BANCO DE DADOS & APIs ==================== */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card-surface space-y-4 p-5">
              <h2 className="text-base font-bold text-white">Banco de Dados &amp; Backup</h2>
              <p className="text-xs leading-relaxed text-zinc-400">
                Motor ativo:{' '}
                <strong className="text-emerald-400">
                  {dbEngine === 'supabase' ? 'Supabase PostgreSQL (Produção)' : 'Banco Local Node.js (.data/concretando-db.json)'}
                </strong>
                . Ao configurar <code>SUPABASE_URL</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code> na Vercel, o
                repositório alterna automaticamente para a nuvem.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleExportBackup} className="btn-brand text-xs">
                  <Download className="h-4 w-4" /> Exportar Backup JSON
                </button>
                <button type="button" onClick={handleResetDb} className="btn-outline-dark text-xs">
                  Restaurar Catálogo Padrão
                </button>
              </div>
            </div>

            <div className="card-surface space-y-3 p-5">
              <h2 className="text-base font-bold text-white">Testador de APIs REST (Next.js Route Handlers)</h2>
              <div className="flex flex-wrap gap-2">
                {['/api/health', '/api/settings', '/api/products', '/api/stores'].map((ep) => (
                  <button
                    key={ep}
                    type="button"
                    onClick={() => handleTestApi(ep)}
                    className="btn-outline-dark px-3 py-1.5 text-xs"
                  >
                    GET {ep}
                  </button>
                ))}
              </div>
              <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-[#070709] p-3 font-mono text-[11px] text-zinc-300">
                {apiOutput}
              </pre>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-500 bg-[#16161d] px-4 py-3 text-sm font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
