'use client';

import { useMemo, useState } from 'react';
import { Calculator, MessageCircle, Save, ShoppingCart } from 'lucide-react';
import type { Product, SiteSettings, StoreLocation } from '@/types';
import { calculateM2, formatBRL } from '@/lib/format';

interface M2CalculatorProps {
  products: Product[];
  stores: StoreLocation[];
  settings: SiteSettings;
  selectedProductId: string;
  selectedStoreId: string;
  onSelectProductId: (id: string) => void;
  onAddCalculatedToCart: (product: Product, quantity: number, note: string, deliveryMode: 'pickup' | 'delivery') => void;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

export function M2Calculator({
  products,
  stores,
  settings,
  selectedProductId,
  selectedStoreId,
  onSelectProductId,
  onAddCalculatedToCart,
  onNotify
}: M2CalculatorProps) {
  const m2Products = useMemo(() => products.filter((p) => p.m2_supported !== false), [products]);
  const activeProduct = m2Products.find((p) => p.id === selectedProductId) || m2Products[0];

  const [mode, setMode] = useState<'dimensions' | 'area'>('dimensions');
  const [width, setWidth] = useState('6');
  const [length, setLength] = useState('4.5');
  const [directArea, setDirectArea] = useState('27');
  const [lossPct, setLossPct] = useState(10);
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>(
    settings.pickup_enabled ? 'pickup' : 'delivery'
  );
  const [storeId, setStoreId] = useState(selectedStoreId || stores[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const result = useMemo(() => {
    if (!activeProduct) return null;
    return calculateM2({
      product: activeProduct,
      mode,
      width: Number(width),
      length: Number(length),
      directArea: Number(directArea),
      lossPct,
      pixDiscountPct: settings.pix_discount_pct
    });
  }, [activeProduct, mode, width, length, directArea, lossPct, settings.pix_discount_pct]);

  async function handleSaveQuote() {
    if (!result || !activeProduct) return;
    setSaving(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result,
          delivery_mode: deliveryMode,
          store_id: deliveryMode === 'pickup' ? storeId : null,
          notes
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar cotação.');
      onNotify(`Cotação ${json.data.quote_code} salva no Banco de Dados!`, 'success');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Falha ao salvar cotação.');
    } finally {
      setSaving(false);
    }
  }

  function handleWhatsApp() {
    if (!result) return;
    const msg = [
      `Olá equipe *${settings.brand_name}*! Fiz uma cotação por m² no site:`,
      `• Material: ${result.product_name}`,
      `• Área: ${result.area_m2} m² (+${result.loss_pct}% perda = ${result.total_area_with_loss} m²)`,
      `• Quantidade ideal: ${result.calculated_quantity} ${result.unit}`,
      `• Valor estimado: ${formatBRL(result.estimated_total)}`,
      `• Modalidade: ${deliveryMode === 'pickup' ? 'Retirada na Loja (Grátis)' : 'Entrega na Obra'}`
    ].join('\n');
    window.open(`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  return (
    <section id="calculadora" className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
            Cotação Inteligente por Metro Quadrado (m²)
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Informe as medidas da parede, piso, laje ou telhado. Calculamos rendimento técnico, perda por recortes e o melhor valor.
          </p>
        </div>
        <span className="rounded-md border border-brand/50 bg-brand/15 px-3 py-1 font-mono text-xs font-bold text-red-300">
          CÁLCULO TÉCNICO ABNT
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-brand/45 bg-gradient-to-br from-[#15151b] to-[#0f0f13] p-5 shadow-2xl sm:p-7 lg:grid-cols-12">
        {/* Formulário */}
        <div className="space-y-4 lg:col-span-7">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              1. Material para cotação
            </label>
            <select
              value={activeProduct?.id || ''}
              onChange={(e) => onSelectProductId(e.target.value)}
              className="input-dark"
            >
              {m2Products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatBRL(p.price)}/{p.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              2. Modo de metragem
            </span>
            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-[#0b0b0f] p-1">
              <button
                type="button"
                onClick={() => setMode('dimensions')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  mode === 'dimensions' ? 'bg-brand text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Largura × Comprimento
              </button>
              <button
                type="button"
                onClick={() => setMode('area')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  mode === 'area' ? 'bg-brand text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Área Total (m²)
              </button>
            </div>
          </div>

          {mode === 'dimensions' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400">Largura (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400">Comprimento ou Altura (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="input-dark"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-400">Área Total (m²)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={directArea}
                onChange={(e) => setDirectArea(e.target.value)}
                className="input-dark"
              />
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>3. Margem de perda técnica / recortes</span>
              <span className="font-bold text-white">{lossPct}%</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[5, 8, 10, 15].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setLossPct(v)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    lossPct === v
                      ? 'border-brand bg-brand/20 text-white'
                      : 'border-white/15 bg-[#0b0b0f] text-zinc-400 hover:border-white/30'
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={25}
              value={lossPct}
              onChange={(e) => setLossPct(Number(e.target.value))}
              className="mt-2.5 w-full accent-brand"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-400">4. Recebimento</label>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as 'pickup' | 'delivery')}
                className="input-dark"
              >
                {settings.pickup_enabled && <option value="pickup">Retirada na Loja (Grátis)</option>}
                {settings.delivery_enabled && <option value="delivery">Entrega na Obra</option>}
              </select>
            </div>
            {deliveryMode === 'pickup' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400">Unidade de Retirada</label>
                <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="input-dark">
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-400">Observação da obra (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Parede externa, retirar no sábado de manhã..."
              className="input-dark"
            />
          </div>
        </div>

        {/* Painel de Resultado */}
        <div className="flex flex-col justify-between gap-5 rounded-xl border border-white/15 border-t-4 border-t-brand bg-[#0b0b0f] p-5 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
                <Calculator className="h-4 w-4" /> Resumo da Cotação
              </span>
              <span className="text-[11px] text-zinc-400">{activeProduct?.m2_application}</span>
            </div>
            <h3 className="mt-2 text-lg font-bold text-white">{activeProduct?.name}</h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-obsidian-800 p-3">
                <span className="text-[11px] uppercase text-zinc-400">Área Líquida</span>
                <strong className="mt-1 block text-lg text-white">{result ? `${result.area_m2} m²` : '—'}</strong>
              </div>
              <div className="rounded-lg border border-white/10 bg-obsidian-800 p-3">
                <span className="text-[11px] uppercase text-zinc-400">Área c/ Perda</span>
                <strong className="mt-1 block text-lg text-white">
                  {result ? `${result.total_area_with_loss} m²` : '—'}
                </strong>
              </div>
              <div className="rounded-lg border border-white/10 bg-obsidian-800 p-3">
                <span className="text-[11px] uppercase text-zinc-400">Quantidade Ideal</span>
                <strong className="mt-1 block text-lg text-white">
                  {result ? `${result.calculated_quantity} ${result.unit}` : '—'}
                </strong>
              </div>
              <div className="rounded-lg border border-white/10 bg-obsidian-800 p-3">
                <span className="text-[11px] uppercase text-zinc-400">Custo por m²</span>
                <strong className="mt-1 block text-lg text-white">
                  {result ? `${formatBRL(result.price_per_m2)}/m²` : '—'}
                </strong>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-brand/45 bg-brand/10 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">Investimento Estimado</span>
            <div className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
              {result ? formatBRL(result.estimated_total) : 'Informe medidas válidas'}
            </div>
            {result && (
              <p className="mt-1 text-xs font-semibold text-emerald-400">
                {formatBRL(result.pix_total)} no PIX ({settings.pix_discount_pct}% de desconto)
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={!result || !activeProduct}
              onClick={() => {
                if (result && activeProduct) {
                  onAddCalculatedToCart(
                    activeProduct,
                    result.calculated_quantity,
                    `Cotação m²: ${result.area_m2} m² (+${result.loss_pct}% perda)`,
                    deliveryMode
                  );
                }
              }}
              className="btn-brand w-full py-3"
            >
              <ShoppingCart className="h-4 w-4" />
              Adicionar ao Carrinho
            </button>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={!result || saving}
                onClick={handleSaveQuote}
                className="btn-outline-dark py-2 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Salvando...' : 'Salvar Cotação'}
              </button>
              <button
                type="button"
                disabled={!result}
                onClick={handleWhatsApp}
                className="btn-outline-dark py-2 text-xs"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
