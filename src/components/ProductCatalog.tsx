'use client';

import { useMemo, useState } from 'react';
import { Calculator, Heart, Search, ShoppingCart } from 'lucide-react';
import type { Product, ProductCategory } from '@/types';
import { PRODUCT_CATEGORIES } from '@/lib/seed';
import { formatBRL } from '@/lib/format';

interface ProductCatalogProps {
  products: Product[];
  activeCategory: 'todos' | ProductCategory;
  favorites: string[];
  onCategoryChange: (cat: 'todos' | ProductCategory) => void;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onQuoteProduct: (id: string) => void;
}

export function ProductCatalog({
  products,
  activeCategory,
  favorites,
  onCategoryChange,
  onToggleFavorite,
  onAddToCart,
  onQuoteProduct
}: ProductCatalogProps) {
  const [search, setSearch] = useState('');
  const [promoOnly, setPromoOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'promo' | 'price_asc' | 'price_desc' | 'name'>('promo');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (activeCategory !== 'todos' && p.category !== activeCategory) return false;
      if (promoOnly && !p.is_promo) return false;
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.short_description} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price_asc') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') return [...list].sort((a, b) => b.price - a.price);
    if (sortBy === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return [...list].sort((a, b) => Number(b.is_promo) - Number(a.is_promo));
  }, [products, activeCategory, promoOnly, search, sortBy]);

  return (
    <section id="catalogo" className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
            Catálogo de Materiais
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Estoque atualizado em tempo real, opção de cotação por m² e retirada expressa nas unidades físicas.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-obsidian-800 px-3 py-2 text-xs font-semibold text-zinc-200">
          <input
            type="checkbox"
            checked={promoOnly}
            onChange={(e) => setPromoOnly(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Somente Promoções
        </label>
      </div>

      {/* Filtros responsivos */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id as 'todos' | ProductCategory)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
                activeCategory === cat.id
                  ? 'border-brand bg-brand text-white shadow'
                  : 'border-white/15 bg-obsidian-850 text-zinc-400 hover:border-brand hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1 sm:min-w-[230px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tijolo, aço, cimento..."
              className="input-dark pl-9"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="input-dark sm:w-44"
          >
            <option value="promo">Ordenar: Ofertas</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
            <option value="name">Nome (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid Modular (1 col mobile -> 2 col tablet -> 3/4 col desktop) */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-zinc-400">
          Nenhum material encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const isFav = favorites.includes(p.id);
            return (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#15151b] transition hover:-translate-y-1 hover:border-brand/70 hover:shadow-2xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-obsidian-950">
                  <img
                    src={p.image_url || '/images/hero-warehouse.jpg'}
                    alt={p.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  {p.is_promo && p.promo_badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide text-white shadow">
                      {p.promo_badge}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(p.id)}
                    aria-label="Favoritar"
                    className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border transition ${
                      isFav
                        ? 'border-brand bg-brand text-white'
                        : 'border-white/20 bg-black/70 text-white hover:border-brand'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                    <span>SKU: {p.sku}</span>
                    {p.pickup_ready && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-400">
                        ✓ {p.pickup_time_label}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold leading-snug text-white">{p.name}</h3>
                  <p className="flex-1 text-xs leading-relaxed text-zinc-400">{p.short_description}</p>

                  {p.m2_supported && (
                    <div className="rounded-md border border-dashed border-brand/40 bg-brand/10 px-2.5 py-1 text-[11px] text-red-300">
                      📐 {p.m2_application}
                    </div>
                  )}

                  <div className="pt-1">
                    {p.original_price && p.original_price > p.price && (
                      <span className="mr-2 text-xs text-zinc-500 line-through">
                        {formatBRL(p.original_price)}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-white">{formatBRL(p.price)}</span>
                      <span className="text-xs text-zinc-400">/ {p.unit}</span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                    <button type="button" onClick={() => onAddToCart(p)} className="btn-brand py-2 text-xs">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Carrinho
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuoteProduct(p.id)}
                      className="btn-outline-dark px-3 py-2 text-xs"
                      title="Cotar por m²"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      m²
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
