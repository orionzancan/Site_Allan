import { NextResponse } from 'next/server';
import { getDatabaseEngine, getProducts } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const engine = getDatabaseEngine();
    const products = await getProducts();
    return NextResponse.json({
      ok: true,
      service: 'concretando-nextjs-api',
      database: engine,
      productsCount: products.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
