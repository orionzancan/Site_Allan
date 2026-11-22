import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { deleteProduct, getProducts, upsertProduct } from '@/lib/db/repository';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const includeAll = searchParams.get('all') === 'true' && isAdminRequest(req);
  const products = await getProducts(includeAll);
  return NextResponse.json({ ok: true, data: products });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Acesso restrito ao administrador.' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Product;
    if (!body.name || body.price == null) {
      return NextResponse.json({ ok: false, error: 'Nome e preço do produto são obrigatórios.' }, { status: 400 });
    }
    const saved = await upsertProduct(body);
    return NextResponse.json({ ok: true, data: saved }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro ao salvar produto.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  return POST(req);
}

export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Acesso restrito ao administrador.' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Informe o parâmetro ?id= do produto.' }, { status: 400 });
  }
  await deleteProduct(id);
  return NextResponse.json({ ok: true, deletedId: id });
}
