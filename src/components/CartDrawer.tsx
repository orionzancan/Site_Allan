'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus, Search, Trash2, X } from 'lucide-react';
import type { CartItem, OrderRecord, SiteSettings, StoreLocation } from '@/types';
import { PICKUP_SLOTS } from '@/lib/seed';
import { estimateShipping, formatBRL } from '@/lib/format';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  stores: StoreLocation[];
  settings: SiteSettings;
  selectedStoreId: string;
  fulfillment: 'pickup' | 'delivery';
  customerDefaults: { name: string; email: string; phone: string };
  onClose: () => void;
  onFulfillmentChange: (mode: 'pickup' | 'delivery') => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onOrderCreated: (order: OrderRecord) => void;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

export function CartDrawer({
  open,
  items,
  stores,
  settings,
  selectedStoreId,
  fulfillment,
  customerDefaults,
  onClose,
  onFulfillmentChange,
  onUpdateQty,
  onOrderCreated,
  onNotify
}: CartDrawerProps) {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [storeId, setStoreId] = useState(selectedStoreId || stores[0]?.id || '');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState(PICKUP_SLOTS[0]);
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [lookingUpCep, setLookingUpCep] = useState(false);

  const [customerName, setCustomerName] = useState(customerDefaults.name);
  const [customerEmail, setCustomerEmail] = useState(customerDefaults.email);
  const [customerPhone, setCustomerPhone] = useState(customerDefaults.phone);
  const [customerDoc, setCustomerDoc] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'boleto'>('pix');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setStoreId(selectedStoreId || stores[0]?.id || '');
  }, [selectedStoreId, stores]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setPickupDate(today);
  }, []);

  useEffect(() => {
    if (customerDefaults.name) setCustomerName(customerDefaults.name);
    if (customerDefaults.email) setCustomerEmail(customerDefaults.email);
    if (customerDefaults.phone) setCustomerPhone(customerDefaults.phone);
  }, [customerDefaults]);

  if (!open) return null;

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingInfo =
    fulfillment === 'pickup'
      ? { cost: 0, label: 'Retirada Grátis na Loja' }
      : estimateShipping(cep, subtotal, settings);
  const discount =
    paymentMethod === 'pix' ? Number(((subtotal * settings.pix_discount_pct) / 100).toFixed(2)) : 0;
  const total = Math.max(0, Number((subtotal + shippingInfo.cost - discount).toFixed(2)));

  async function handleLookupCep() {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      onNotify('Digite um CEP válido com 8 números.');
      return;
    }
    setLookingUpCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error('CEP não encontrado.');
      setAddress([data.logradouro, data.bairro].filter(Boolean).join(' - '));
      setCity(data.localidade || '');
      setStateUf(data.uf || '');
      onNotify(`Endereço preenchido via ViaCEP (${data.localidade}/${data.uf})`, 'success');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao consultar ViaCEP.');
    } finally {
      setLookingUpCep(false);
    }
  }

  async function handleConfirmOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const store = stores.find((s) => s.id === storeId);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          customer_phone: customerPhone.trim(),
          customer_document: customerDoc.trim() || null,
          fulfillment_type: fulfillment,
          store_id: fulfillment === 'pickup' ? store?.id || null : null,
          store_name: fulfillment === 'pickup' ? store?.name || null : null,
          pickup_date: fulfillment === 'pickup' ? pickupDate : null,
          pickup_slot: fulfillment === 'pickup' ? pickupSlot : null,
          delivery_cep: fulfillment === 'delivery' ? cep : null,
          delivery_address: fulfillment === 'delivery' ? address : null,
          delivery_city: fulfillment === 'delivery' ? city : null,
          delivery_state: fulfillment === 'delivery' ? stateUf : null,
          payment_method: paymentMethod,
          subtotal,
          shipping_cost: shippingInfo.cost,
          discount,
          total,
          items
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao finalizar pedido.');
      setStep('cart');
      onOrderCreated(json.data as OrderRecord);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Falha ao confirmar pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-white/15 bg-obsidian-850 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="text-base font-bold text-white">
            {step === 'cart' ? 'Seu Carrinho de Obra' : 'Finalizar Pedido'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-obsidian-800 text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'cart' ? (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-zinc-400">
                  Seu carrinho está vazio. Adicione materiais pelo catálogo ou pela calculadora por m².
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product_id}
                    className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-obsidian-800 p-3"
                  >
                    <img
                      src={item.image_url || '/images/hero-warehouse.jpg'}
                      alt={item.name}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-zinc-400">
                        {formatBRL(item.price)} / {item.unit}
                      </p>
                      {item.note && <p className="truncate text-[11px] text-red-300">{item.note}</p>}
                      <div className="mt-1.5 inline-flex items-center rounded-md border border-white/15 bg-obsidian-950">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.product_id, item.quantity - 1)}
                          className="grid h-7 w-7 place-items-center text-zinc-300 hover:text-white"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => onUpdateQty(item.product_id, Number(e.target.value))}
                          className="w-12 bg-transparent text-center text-xs font-semibold text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.product_id, item.quantity + 1)}
                          className="grid h-7 w-7 place-items-center text-zinc-300 hover:text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatBRL(item.price * item.quantity)}</p>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.product_id, 0)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-red-400 hover:underline"
                      >
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 border-t border-white/10 bg-[#0c0c10] p-5">
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-obsidian-950 p-1">
                {settings.pickup_enabled && (
                  <button
                    type="button"
                    onClick={() => onFulfillmentChange('pickup')}
                    className={`rounded-lg py-2 text-xs font-semibold transition ${
                      fulfillment === 'pickup' ? 'bg-brand text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Retirar na Loja (Grátis)
                  </button>
                )}
                {settings.delivery_enabled && (
                  <button
                    type="button"
                    onClick={() => onFulfillmentChange('delivery')}
                    className={`rounded-lg py-2 text-xs font-semibold transition ${
                      fulfillment === 'delivery' ? 'bg-brand text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Entregar na Obra
                  </button>
                )}
              </div>

              {fulfillment === 'pickup' ? (
                <div className="space-y-2">
                  <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="input-dark text-xs">
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="input-dark text-xs"
                    />
                    <select
                      value={pickupSlot}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      className="input-dark text-xs"
                    >
                      {PICKUP_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={9}
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="CEP da obra (ex: 01001-000)"
                      className="input-dark text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleLookupCep}
                      disabled={lookingUpCep}
                      className="btn-outline-dark shrink-0 px-3 py-2 text-xs"
                    >
                      <Search className="h-3.5 w-3.5" />
                      {lookingUpCep ? '...' : 'CEP'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número e bairro"
                    className="input-dark text-xs"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Cidade"
                      className="input-dark col-span-2 text-xs"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      value={stateUf}
                      onChange={(e) => setStateUf(e.target.value)}
                      placeholder="UF"
                      className="input-dark text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 border-t border-white/10 pt-3 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <strong className="text-white">{formatBRL(subtotal)}</strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{shippingInfo.label}</span>
                  <strong className={shippingInfo.cost === 0 ? 'text-emerald-400' : 'text-white'}>
                    {shippingInfo.cost === 0 ? 'GRÁTIS' : formatBRL(shippingInfo.cost)}
                  </strong>
                </div>
                <div className="flex justify-between pt-1 text-base font-extrabold text-white">
                  <span>Total (PIX -{settings.pix_discount_pct}%)</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => setStep('checkout')}
                className="btn-brand w-full py-3"
              >
                Continuar para Finalização
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleConfirmOrder} className="flex flex-1 flex-col justify-between overflow-y-auto p-5">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400">Nome completo / Empresa *</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400">E-mail *</label>
                <input
                  required
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-400">WhatsApp *</label>
                  <input
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-400">CPF ou CNPJ</label>
                  <input
                    value={customerDoc}
                    onChange={(e) => setCustomerDoc(e.target.value)}
                    placeholder="Para Nota Fiscal"
                    className="input-dark"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400">Forma de pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'pix' | 'cartao' | 'boleto')}
                  className="input-dark"
                >
                  <option value="pix">PIX ({settings.pix_discount_pct}% de desconto imediato)</option>
                  <option value="cartao">Cartão de Crédito (até 12x)</option>
                  <option value="boleto">Boleto / Pagamento na Retirada</option>
                </select>
              </div>

              <div className="rounded-xl border border-brand/40 bg-brand/10 p-3.5 text-xs space-y-1">
                <div className="flex justify-between text-zinc-300">
                  <span>Subtotal</span>
                  <span>{formatBRL(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Frete / Retirada</span>
                  <span>{shippingInfo.cost === 0 ? 'GRÁTIS' : formatBRL(shippingInfo.cost)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto PIX</span>
                    <span>- {formatBRL(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-2 text-base font-extrabold text-white">
                  <span>Total Final</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setStep('cart')} className="btn-outline-dark flex-1">
                Voltar
              </button>
              <button type="submit" disabled={submitting} className="btn-brand flex-[2]">
                {submitting ? 'Processando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
