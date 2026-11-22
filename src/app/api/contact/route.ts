import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { createContact, getContacts } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Acesso restrito ao administrador.' }, { status: 401 });
  }
  const contacts = await getContacts();
  return NextResponse.json({ ok: true, data: contacts });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json({ ok: false, error: 'Nome, e-mail e mensagem são obrigatórios.' }, { status: 400 });
    }
    const saved = await createContact({
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      subject: body.subject || 'Orçamento / Atendimento',
      message: body.message
    });
    return NextResponse.json({ ok: true, data: saved }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro ao enviar mensagem.' },
      { status: 500 }
    );
  }
}
