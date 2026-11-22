import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { createOrder, getOrders, updateOrderStatus } from '@/lib/db/repository';
import type { OrderStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Acesso restrito ao administrador.' }, { status: 401 });
  }
  const orders = await getOrders();
  return NextResponse.json({ ok: true, data: orders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.customer_name || !body.customer_email || !body.customer_phone || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ ok: false, error: 'Dados do cliente e itens são obrigatórios.' }, { status: 400 });
    }
    const saved = await createOrder({
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      customer_document: body.customer_document || null,
      fulfillment_type: body.fulfillment_type === 'delivery' ? 'delivery' : 'pickup',
      store_id: body.store_id || null,
      store_name: body.store_name || null,
      pickup_date: body.pickup_date || null,
      pickup_slot: body.pickup_slot || null,
      delivery_cep: body.delivery_cep || null,
      delivery_address: body.delivery_address || null,
      delivery_city: body.delivery_city || null,
      delivery_state: body.delivery_state || null,
      payment_method: body.payment_method || 'pix',
      subtotal: Number(body.subtotal ?? 0),
      shipping_cost: Number(body.shipping_cost ?? 0),
      discount: Number(body.discount ?? 0),
      total: Number(body.total ?? 0),
      items: body.items
    });
    return NextResponse.json({ ok: true, data: saved }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro ao criar pedido.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Acesso restrito ao administrador.' }, { status: 401 });
  }
  const body = (await req.json()) as { order_code?: string; status?: OrderStatus };
  if (!body.order_code || !body.status) {
    return NextResponse.json({ ok: false, error: 'Informe order_code e status.' }, { status: 400 });
  }
  const updated = await updateOrderStatus(body.order_code, body.status);
  if (!updated) {
    return NextResponse.json({ ok: false, error: 'Pedido não encontrado.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: updated });
}
