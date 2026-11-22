import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { deleteStore, getStores, upsertStore } from '@/lib/db/repository';
import type { StoreLocation } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const includeAll = searchParams.get('all') === 'true' && isAdminRequest(req);
  const stores = await getStores(includeAll);
  return NextResponse.json({ ok: true, data: stores });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Acesso restrito ao administrador.' }, { status: 401 });
  }
  const body = (await req.json()) as StoreLocation;
  if (!body.name || !body.address) {
    return NextResponse.json({ ok: false, error: 'Nome e endereço da loja são obrigatórios.' }, { status: 400 });
  }
  const saved = await upsertStore(body);
  return NextResponse.json({ ok: true, data: saved }, { status: 201 });
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
    return NextResponse.json({ ok: false, error: 'Informe o ?id= da loja.' }, { status: 400 });
  }
  await deleteStore(id);
  return NextResponse.json({ ok: true, deletedId: id });
}
