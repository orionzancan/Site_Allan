import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { exportFullSnapshot, getDatabaseEngine, resetLocalDatabase } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Acesso restrito ao administrador.' }, { status: 401 });
  }
  const snapshot = await exportFullSnapshot();
  return NextResponse.json({
    ok: true,
    engine: getDatabaseEngine(),
    exportedAt: new Date().toISOString(),
    snapshot
  });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Acesso restrito ao administrador.' }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action === 'reset') {
    const fresh = resetLocalDatabase();
    return NextResponse.json({ ok: true, data: fresh });
  }
  return NextResponse.json({ ok: false, error: 'Ação inválida.' }, { status: 400 });
}
