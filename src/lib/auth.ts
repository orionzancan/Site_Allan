import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'concretando_admin_session';

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'concretando-dev-secret-change-in-production-2026';
}

export function getAdminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL || 'admin@concretando.com.br').toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD || 'Concretando@2026'
  };
}

function signPayload(payloadB64: string): string {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadB64)
    .digest('base64url');
}

export function createAdminToken(email: string): string {
  const payload = {
    email,
    role: 'admin',
    exp: Date.now() + 1000 * 60 * 60 * 12 // 12 horas
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifyAdminToken(token: string | undefined): { email: string; role: string } | null {
  if (!token || !token.includes('.')) return null;
  const [payloadB64, providedSig] = token.split('.');
  if (!payloadB64 || !providedSig) return null;

  const expectedSig = signPayload(payloadB64);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (parsed.role !== 'admin' || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return { email: parsed.email, role: parsed.role };
  } catch {
    return null;
  }
}

export function getAdminSession(): { email: string; role: string } | null {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}

export function isAdminRequest(req?: Request): boolean {
  if (getAdminSession()) return true;
  if (req && process.env.CONCRETANDO_API_KEY) {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey && apiKey === process.env.CONCRETANDO_API_KEY) return true;
  }
  return false;
}
