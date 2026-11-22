'use client';

import Link from 'next/link';
import { Heart, ShieldCheck, ShoppingCart, Menu, X, Phone, User } from 'lucide-react';
import type { SiteSettings } from '@/types';

interface HeaderProps {
  settings: SiteSettings;
  dbEngine: 'supabase' | 'local';
  cartCount: number;
  favCount: number;
  userName: string | null;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onOpenContact: () => void;
  onOpenAuth: () => void;
}

export function Header({
  settings,
  dbEngine,
  cartCount,
  favCount,
  userName,
  mobileMenuOpen,
  onToggleMobileMenu,
  onOpenCart,
  onOpenFavorites,
  onOpenContact,
  onOpenAuth
}: HeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-brand bg-[#09090b]/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          {/* Esquerda */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#topo"
              aria-label={settings.brand_name}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-white/15 bg-gradient-to-br from-brand to-brand-dark shadow-lg sm:h-12 sm:w-12"
            >
              <svg width="26" height="26" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <rect x="6" y="21" width="24" height="9" rx="2" fill="#18181b" stroke="#f4f4f5" strokeWidth="1.4" />
                <rect
                  x="4"
                  y="10"
                  width="22"
                  height="9"
                  rx="2"
                  transform="rotate(-14 4 10)"
                  fill="#27272a"
                  stroke="#f4f4f5"
                  strokeWidth="1.4"
                />
                <circle cx="11" cy="13" r="1.5" fill="#e62229" />
                <circle cx="16" cy="11.8" r="1.5" fill="#e62229" />
                <circle cx="21" cy="10.6" r="1.5" fill="#e62229" />
              </svg>
            </a>

            <button
              type="button"
              onClick={onToggleMobileMenu}
              aria-label="Abrir menu"
              className="grid h-10 w-10 place-items-center rounded-lg border border-brand/45 bg-brand/10 text-brand transition hover:bg-brand/20"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={onOpenContact}
              className="btn-brand hidden px-3.5 py-2 text-xs md:inline-flex"
            >
              <Phone className="h-3.5 w-3.5" />
              Contatar
            </button>
          </div>

          {/* Centro — Marca */}
          <a href="#topo" className="flex flex-col items-center text-center leading-none">
            <span className="font-display text-2xl font-bold uppercase tracking-wider text-brand sm:text-3xl lg:text-4xl">
              {settings.brand_name}
            </span>
            <span className="font-serif text-xs italic text-red-400 sm:text-sm">
              {settings.slogan}
            </span>
          </a>

          {/* Direita */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn-brand hidden px-3.5 py-2 text-xs lg:inline-flex"
            >
              <User className="h-3.5 w-3.5" />
              {userName ? `Olá, ${userName.split(' ')[0]}` : 'Entre ou cadastre'}
            </button>

            <button
              type="button"
              onClick={onOpenFavorites}
              aria-label="Favoritos"
              className="relative grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-obsidian-800 text-brand transition hover:border-brand"
            >
              <Heart className="h-4 w-4 fill-current" />
              {favCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-obsidian-900 bg-brand px-1 text-[11px] font-bold text-white">
                  {favCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Abrir carrinho"
              className="relative grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-obsidian-800 text-brand transition hover:border-brand"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-obsidian-900 bg-brand px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <Link
              href="/admin"
              title="Painel Administrativo (Acesso Restrito)"
              className="hidden h-10 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-zinc-200 transition hover:border-brand hover:text-white sm:inline-flex"
            >
              <ShieldCheck className="h-4 w-4 text-brand" />
              <span className="hidden xl:inline">Admin</span>
            </Link>
          </div>
        </div>

        {/* Faixa de Promoções + Navegação Desktop */}
        <div
          className="border-t border-white/10 py-2"
          style={{
            background: 'linear-gradient(90deg, var(--brand-primary-dark), var(--brand-primary), var(--brand-primary-dark))'
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 text-xs font-semibold text-white sm:px-6">
            <span className="truncate uppercase tracking-wide">{settings.promo_ribbon_text}</span>
            <nav className="hidden items-center gap-5 md:flex">
              <a href="#calculadora" className="hover:underline">Cotação por m²</a>
              <a href="#catalogo" className="hover:underline">Catálogo</a>
              <a href="#retirada" className="hover:underline">Retirada na Loja</a>
            </nav>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/30 px-2.5 py-0.5 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              {dbEngine === 'supabase' ? 'Supabase Cloud' : 'Banco Local Node.js'}
            </span>
          </div>
        </div>
      </header>

      {/* Drawer Menu Lateral (Desktop & Mobile) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onToggleMobileMenu} />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-white/15 bg-obsidian-850 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="font-display text-xl font-bold uppercase text-brand">{settings.brand_name}</p>
                <p className="font-serif text-xs italic text-red-400">{settings.slogan}</p>
              </div>
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-obsidian-800 text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="mt-5 flex flex-1 flex-col gap-2.5">
              <a href="#calculadora" onClick={onToggleMobileMenu} className="btn-brand justify-start">
                Cotação por m²
              </a>
              <a href="#catalogo" onClick={onToggleMobileMenu} className="btn-outline-dark justify-start">
                Catálogo &amp; Promoções
              </a>
              <a href="#retirada" onClick={onToggleMobileMenu} className="btn-outline-dark justify-start">
                Retirada Grátis na Loja
              </a>
              <button
                type="button"
                onClick={() => {
                  onToggleMobileMenu();
                  onOpenAuth();
                }}
                className="btn-outline-dark justify-start"
              >
                <User className="h-4 w-4" />
                {userName ? `Conta: ${userName}` : 'Entre ou Cadastre-se'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleMobileMenu();
                  onOpenContact();
                }}
                className="btn-outline-dark justify-start"
              >
                <Phone className="h-4 w-4" />
                Contatar Vendedor
              </button>
            </nav>

            <div className="border-t border-white/10 pt-4">
              <Link
                href="/admin"
                onClick={onToggleMobileMenu}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-brand/20"
              >
                <ShieldCheck className="h-4 w-4" />
                Painel do Administrador
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
