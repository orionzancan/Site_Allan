'use client';

import type { ProductCategory, SiteSettings } from '@/types';

interface HeroSectionProps {
  settings: SiteSettings;
  onQuickCategory: (category: ProductCategory) => void;
}

export function HeroSection({ settings, onQuickCategory }: HeroSectionProps) {
  return (
    <section id="topo" className="mx-auto max-w-7xl px-3 pt-6 pb-4 sm:px-6 sm:pt-9">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Banner Principal */}
        <div className="relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-2xl border-2 border-brand/60 p-6 shadow-2xl sm:min-h-[420px] sm:p-9 lg:col-span-7">
          <img
            src="/images/hero-warehouse.jpg"
            alt="Depósito de Materiais de Construção"
            className="absolute inset-0 h-full w-full object-cover brightness-[0.42] contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />

          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center rounded-full border border-brand/60 bg-brand/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-red-300">
              {settings.hero_eyebrow}
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-[1.06] tracking-wide text-white sm:text-4xl lg:text-5xl">
              {settings.hero_title}
            </h1>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">{settings.hero_subtitle}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#calculadora" className="btn-brand px-5 py-3">
                {settings.hero_cta_label}
              </a>
              <a href="#catalogo" className="btn-outline-dark px-5 py-3">
                Ver Promoções
              </a>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-xs sm:text-sm">
              <div>
                <strong className="block text-white">Retirada Grátis</strong>
                <span className="text-zinc-400">Pronto em até 2h</span>
              </div>
              <div>
                <strong className="block text-white">{settings.pix_discount_pct}% OFF no PIX</strong>
                <span className="text-zinc-400">Ou até 12x cartão</span>
              </div>
              <div>
                <strong className="block text-white">Next.js + Supabase</strong>
                <span className="text-zinc-400">Pronto para Vercel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mosaico de Categorias com Bordas Vermelhas (Referência Visual) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
          <button
            type="button"
            onClick={() => onQuickCategory('alvenaria')}
            className="group relative flex min-h-[180px] items-end overflow-hidden rounded-2xl border-[3px] border-brand bg-obsidian-800 p-4 text-left transition hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(207,20,27,0.3)] sm:row-span-2"
          >
            <img
              src="/images/cat-tijolos.jpg"
              alt="Tijolos e Blocos"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/90 via-black/20 to-transparent" />
            <div className="relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">Alvenaria &amp; Estrutura</span>
              <h3 className="text-lg font-bold text-white">Tijolos e Blocos</h3>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onQuickCategory('aco')}
            className="group relative flex min-h-[160px] items-end overflow-hidden rounded-2xl border-[3px] border-brand bg-obsidian-800 p-4 text-left transition hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(207,20,27,0.3)]"
          >
            <img
              src="/images/cat-vergalhao.jpg"
              alt="Aço e Vergalhões"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/90 via-black/20 to-transparent" />
            <div className="relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">Aço Certificado</span>
              <h3 className="text-lg font-bold text-white">Vergalhões CA-50</h3>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onQuickCategory('acabamento')}
            className="group relative flex min-h-[160px] items-end overflow-hidden rounded-2xl border-[3px] border-brand bg-obsidian-800 p-4 text-left transition hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(207,20,27,0.3)]"
          >
            <img
              src="/images/cat-telhas-pisos.jpg"
              alt="Telhas e Porcelanatos"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/90 via-black/20 to-transparent" />
            <div className="relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">Telhado &amp; Piso</span>
              <h3 className="text-lg font-bold text-white">Telhas e Porcelanatos</h3>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
