'use client';

import { CheckCircle2, Clock, MapPin, Truck } from 'lucide-react';
import type { StoreLocation } from '@/types';

interface StorePickupSectionProps {
  stores: StoreLocation[];
  selectedStoreId: string;
  onSelectStore: (id: string) => void;
}

export function StorePickupSection({ stores, selectedStoreId, onSelectStore }: StorePickupSectionProps) {
  return (
    <section id="retirada" className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
            Retirada Grátis na Loja (Click &amp; Collect)
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Compre online, garanta seu estoque e retire sem pagar frete em nossas docas com auxílio de empilhadeira.
          </p>
        </div>
        <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-400">
          FRETE R$ 0,00 • PRONTO EM ATÉ 2H
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => {
          const active = store.id === selectedStoreId;
          return (
            <article
              key={store.id}
              className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 transition ${
                active
                  ? 'border-brand bg-[#18141a] shadow-[0_0_0_1px_var(--brand-primary),0_12px_30px_rgba(207,20,27,0.22)]'
                  : 'border-white/10 bg-[#15151b] hover:border-white/25'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white">{store.name}</h3>
                  {active && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Ativa
                    </span>
                  )}
                </div>

                <p className="flex items-start gap-2 text-xs text-zinc-400">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>
                    {store.address} — {store.city}/{store.state} (CEP {store.cep})
                  </span>
                </p>

                <p className="flex items-center gap-2 text-xs text-zinc-400">
                  <Clock className="h-4 w-4 shrink-0 text-brand" />
                  <span>
                    {store.hours} • {store.phone}
                  </span>
                </p>

                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>{store.pickup_dock_info}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectStore(store.id)}
                className={active ? 'btn-brand w-full text-xs' : 'btn-outline-dark w-full text-xs'}
              >
                {active ? 'Unidade Selecionada para Retirada' : 'Escolher esta Unidade'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
