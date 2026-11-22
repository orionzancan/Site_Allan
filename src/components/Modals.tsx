'use client';

import { useState } from 'react';
import { CheckCircle2, ShoppingCart, X } from 'lucide-react';
import type { OrderRecord, Product } from '@/types';
import { formatBRL } from '@/lib/format';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

export function ContactModal({ open, onClose, onNotify }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Orçamento de Obra Completa');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message })
      });
      if (!res.ok) throw new Error('Erro ao enviar mensagem.');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      onClose();
      onNotify('Mensagem registrada! Nossa equipe retornará em breve.', 'success');
    } catch {
      onNotify('Não foi possível enviar sua mensagem.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-brand/50 bg-obsidian-850 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Fale com a Equipe</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-obsidian-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome ou construtora" className="input-dark" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="input-dark" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp / Telefone" className="input-dark" />
          </div>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input-dark">
            <option>Orçamento de Obra Completa</option>
            <option>Retirada na Loja / Agendamento</option>
            <option>Atacado para Construtoras (CNPJ)</option>
          </select>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Descreva sua obra ou lista de materiais..."
            className="input-dark"
          />
          <button type="submit" disabled={sending} className="btn-brand w-full">
            {sending ? 'Enviando...' : 'Enviar Mensagem'}
          </button>
        </form>
      </div>
    </div>
  );
}

interface FavoritesModalProps {
  open: boolean;
  products: Product[];
  favoriteIds: string[];
  onClose: () => void;
  onAddToCart: (p: Product) => void;
}

export function FavoritesModal({ open, products, favoriteIds, onClose, onAddToCart }: FavoritesModalProps) {
  if (!open) return null;
  const list = products.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-brand/50 bg-obsidian-850 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Materiais Favoritos ({list.length})</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-obsidian-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-400">
            Você ainda não favoritou nenhum material.
          </p>
        ) : (
          <div className="space-y-3">
            {list.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-obsidian-800 p-3">
                <div>
                  <p className="text-sm font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-zinc-400">
                    {formatBRL(p.price)} / {p.unit}
                  </p>
                </div>
                <button type="button" onClick={() => onAddToCart(p)} className="btn-brand px-3 py-1.5 text-xs">
                  <ShoppingCart className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CustomerAuthModalProps {
  open: boolean;
  initial: { name: string; email: string; phone: string };
  onClose: () => void;
  onSave: (user: { name: string; email: string; phone: string }) => void;
}

export function CustomerAuthModal({ open, initial, onClose, onSave }: CustomerAuthModalProps) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-brand/50 bg-obsidian-850 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Entre ou Cadastre-se</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-obsidian-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ name: name.trim(), email: email.trim(), phone: phone.trim() });
            onClose();
          }}
          className="space-y-3"
        >
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="input-dark" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="input-dark" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp" className="input-dark" />
          <button type="submit" className="btn-brand w-full">
            Salvar Dados da Conta
          </button>
        </form>
      </div>
    </div>
  );
}

interface OrderReceiptModalProps {
  order: OrderRecord | null;
  onClose: () => void;
}

export function OrderReceiptModal({ order, onClose }: OrderReceiptModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-500/50 bg-obsidian-850 p-6 text-center shadow-2xl">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <h3 className="mt-3 text-xl font-bold text-white">Pedido Confirmado!</h3>
        <p className="mt-1 text-xs text-zinc-400">Código do pedido: {order.order_code}</p>

        {order.pickup_code && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Apresente este código na doca de retirada
            </span>
            <p className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-white">{order.pickup_code}</p>
            <p className="mt-1 text-xs text-zinc-300">
              {order.store_name} • {order.pickup_date} ({order.pickup_slot})
            </p>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-white/10 bg-obsidian-800 p-3 text-left text-xs text-zinc-300">
          <p>
            <strong>Cliente:</strong> {order.customer_name}
          </p>
          <p>
            <strong>Total:</strong> {formatBRL(order.total)} ({order.payment_method.toUpperCase()})
          </p>
        </div>

        <button type="button" onClick={onClose} className="btn-brand mt-5 w-full">
          Continuar Navegando
        </button>
      </div>
    </div>
  );
}
