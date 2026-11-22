'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import type { CartItem, OrderRecord, Product, ProductCategory, SiteSettings, StoreLocation } from '@/types';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { HeroSection } from '@/components/HeroSection';
import { M2Calculator } from '@/components/M2Calculator';
import { ProductCatalog } from '@/components/ProductCatalog';
import { StorePickupSection } from '@/components/StorePickupSection';
import { CartDrawer } from '@/components/CartDrawer';
import { ContactModal, CustomerAuthModal, FavoritesModal, OrderReceiptModal } from '@/components/Modals';

interface StorefrontClientProps {
  initialSettings: SiteSettings;
  initialProducts: Product[];
  initialStores: StoreLocation[];
  dbEngine: 'supabase' | 'local';
}

export function StorefrontClient({
  initialSettings,
  initialProducts,
  initialStores,
  dbEngine
}: StorefrontClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });

  const [activeCategory, setActiveCategory] = useState<'todos' | ProductCategory>('todos');
  const [calcProductId, setCalcProductId] = useState(initialProducts[0]?.id || '');
  const [selectedStoreId, setSelectedStoreId] = useState(initialStores[0]?.id || '');
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>(
    initialSettings.pickup_enabled ? 'pickup' : 'delivery'
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderRecord | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('concretando_next_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
      const savedFavs = localStorage.getItem('concretando_next_favs');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      const savedCustomer = localStorage.getItem('concretando_next_customer');
      if (savedCustomer) setCustomer(JSON.parse(savedCustomer));
    } catch {
      // ignora
    }
  }, []);

  function notify(msg: string, type: 'success' | 'info' = 'info') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3400);
  }

  function persistCart(next: CartItem[]) {
    setCart(next);
    try {
      localStorage.setItem('concretando_next_cart', JSON.stringify(next));
    } catch {}
  }

  function handleAddToCart(product: Product, qty = 1, note?: string) {
    const existing = cart.find((i) => i.product_id === product.id);
    const next = existing
      ? cart.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + qty, note: note || i.note } : i
        )
      : [
          ...cart,
          {
            product_id: product.id,
            sku: product.sku,
            name: product.name,
            unit: product.unit,
            price: product.price,
            image_url: product.image_url,
            quantity: qty,
            note
          }
        ];
    persistCart(next);
    notify(`Adicionado: ${qty} ${product.unit} de ${product.name}`, 'success');
  }

  function handleUpdateQty(productId: string, qty: number) {
    const next =
      qty <= 0 ? cart.filter((i) => i.product_id !== productId) : cart.map((i) => (i.product_id === productId ? { ...i, quantity: qty } : i));
    persistCart(next);
  }

  function handleToggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem('concretando_next_favs', JSON.stringify(next));
    } catch {}
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        settings={initialSettings}
        dbEngine={dbEngine}
        cartCount={cartCount}
        favCount={favorites.length}
        userName={customer.name || null}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
        onOpenCart={() => setCartOpen(true)}
        onOpenFavorites={() => setFavOpen(true)}
        onOpenContact={() => setContactOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      <main className="flex-1">
        <HeroSection
          settings={initialSettings}
          onQuickCategory={(cat) => {
            setActiveCategory(cat);
            document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <M2Calculator
          products={initialProducts}
          stores={initialStores}
          settings={initialSettings}
          selectedProductId={calcProductId}
          selectedStoreId={selectedStoreId}
          onSelectProductId={setCalcProductId}
          onAddCalculatedToCart={(product, qty, note, deliveryMode) => {
            handleAddToCart(product, qty, note);
            setFulfillment(deliveryMode);
            setCartOpen(true);
          }}
          onNotify={notify}
        />

        <ProductCatalog
          products={initialProducts}
          activeCategory={activeCategory}
          favorites={favorites}
          onCategoryChange={setActiveCategory}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={(p) => handleAddToCart(p, 1)}
          onQuoteProduct={(id) => {
            setCalcProductId(id);
            document.getElementById('calculadora')?.scrollIntoView({ behavior: 'smooth' });
            notify('Material carregado na Calculadora por m²!');
          }}
        />

        {initialSettings.pickup_enabled && (
          <StorePickupSection
            stores={initialStores}
            selectedStoreId={selectedStoreId}
            onSelectStore={(id) => {
              setSelectedStoreId(id);
              setFulfillment('pickup');
              notify('Unidade de retirada selecionada!', 'success');
            }}
          />
        )}
      </main>

      <footer className="mt-12 border-t-2 border-brand bg-[#060608] py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl font-bold uppercase tracking-wider text-brand">
              {initialSettings.brand_name}
            </p>
            <p className="font-serif text-sm italic text-red-400">{initialSettings.slogan}</p>
            <p className="mt-3 text-xs leading-relaxed text-zinc-400">
              Loja profissional de materiais de construção em Next.js (React + Node.js) com cotação técnica por m²,
              retirada grátis na loja, Banco de Dados Local + Supabase e hospedagem otimizada para Vercel.
            </p>
          </div>
          <div className="text-xs text-zinc-400 space-y-1.5">
            <h4 className="mb-2 text-sm font-bold text-white">Atendimento</h4>
            <p>E-mail: {initialSettings.contact_email}</p>
            <p>Telefone: {initialSettings.contact_phone}</p>
            <p>WhatsApp: +{initialSettings.whatsapp_number}</p>
          </div>
          <div className="text-xs text-zinc-400 space-y-2">
            <h4 className="mb-2 text-sm font-bold text-white">Administração &amp; APIs</h4>
            <p>Área exclusiva para gestão de preços, identidade visual, frete, produtos, lojas e pedidos.</p>
            <Link href="/admin" className="btn-outline-dark mt-1 inline-flex px-3 py-1.5 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
              Acessar Painel Admin
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 pt-4 text-[11px] text-zinc-500 sm:px-6">
          <span>© 2026 {initialSettings.brand_name}. Todos os direitos reservados.</span>
          <span>Next.js • React • Node.js • Vercel • Supabase</span>
        </div>
      </footer>

      <MobileBottomNav cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

      <CartDrawer
        open={cartOpen}
        items={cart}
        stores={initialStores}
        settings={initialSettings}
        selectedStoreId={selectedStoreId}
        fulfillment={fulfillment}
        customerDefaults={customer}
        onClose={() => setCartOpen(false)}
        onFulfillmentChange={setFulfillment}
        onUpdateQty={handleUpdateQty}
        onOrderCreated={(order) => {
          persistCart([]);
          setCartOpen(false);
          setLastOrder(order);
        }}
        onNotify={notify}
      />

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} onNotify={notify} />
      <FavoritesModal
        open={favOpen}
        products={initialProducts}
        favoriteIds={favorites}
        onClose={() => setFavOpen(false)}
        onAddToCart={(p) => handleAddToCart(p, 1)}
      />
      <CustomerAuthModal
        open={authOpen}
        initial={customer}
        onClose={() => setAuthOpen(false)}
        onSave={(user) => {
          setCustomer(user);
          try {
            localStorage.setItem('concretando_next_customer', JSON.stringify(user));
          } catch {}
          notify(`Dados salvos para ${user.name}!`, 'success');
        }}
      />
      <OrderReceiptModal order={lastOrder} onClose={() => setLastOrder(null)} />

      {toast && (
        <div
          className={`fixed bottom-20 right-4 z-50 rounded-xl border bg-[#16161d] px-4 py-3 text-sm font-medium text-white shadow-2xl md:bottom-6 ${
            toast.type === 'success' ? 'border-emerald-500' : 'border-brand'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
