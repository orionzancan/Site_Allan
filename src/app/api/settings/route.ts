import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getSettings, updateSettings } from '@/lib/db/repository';
import type { SiteSettings } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ ok: true, data: settings });
}

export async function PUT(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { ok: false, error: 'Acesso negado. Apenas o administrador pode alterar configurações do site.' },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as Partial<SiteSettings>;
    const updated = await updateSettings(body);
    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro ao atualizar configurações.' },
      { status: 500 }
    );
  }
}
