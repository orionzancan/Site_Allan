import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { createQuote, getQuotes } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Acesso restrito ao administrador.' }, { status: 401 });
  }
  const quotes = await getQuotes();
  return NextResponse.json({ ok: true, data: quotes });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.product_name || !body.area_m2 || !body.calculated_quantity) {
      return NextResponse.json({ ok: false, error: 'Dados incompletos da cotação por m².' }, { status: 400 });
    }
    const saved = await createQuote({
      customer_name: body.customer_name || 'Cliente Visitante',
      customer_email: body.customer_email || null,
      customer_phone: body.customer_phone || null,
      product_id: body.product_id || null,
      product_name: body.product_name,
      width_m: body.width_m ?? null,
      length_m: body.length_m ?? null,
      area_m2: Number(body.area_m2),
      loss_pct: Number(body.loss_pct ?? 10),
      total_area_with_loss: Number(body.total_area_with_loss ?? body.area_m2),
      calculated_quantity: Number(body.calculated_quantity),
      unit: body.unit || 'un',
      unit_price: Number(body.unit_price ?? 0),
      estimated_total: Number(body.estimated_total ?? 0),
      delivery_mode: body.delivery_mode === 'delivery' ? 'delivery' : 'pickup',
      store_id: body.store_id || null,
      notes: body.notes || null
    });
    return NextResponse.json({ ok: true, data: saved }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro ao salvar cotação.' },
      { status: 500 }
    );
  }
}
