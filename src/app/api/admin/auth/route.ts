import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  getAdminCredentials,
  getAdminSession
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({ authenticated: true, admin: session }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = (body.email || '').toLowerCase().trim();
    const password = body.password || '';
    const creds = getAdminCredentials();

    if (email !== creds.email || password !== creds.password) {
      return NextResponse.json(
        { ok: false, error: 'E-mail ou senha de administrador inválidos.' },
        { status: 401 }
      );
    }

    const token = createAdminToken(email);
    const res = NextResponse.json({ ok: true, admin: { email, role: 'admin' } });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12 // 12 horas
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida.' }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
  return res;
}
