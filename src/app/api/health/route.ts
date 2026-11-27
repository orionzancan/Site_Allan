import { NextResponse } from 'next/server';
import { getDatabaseEngine, getProducts } from '@/lib/db/repository';
import { getSupabaseServerClient } from '@/lib/db/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const engine = getDatabaseEngine();
    const sb = getSupabaseServerClient();
    let supabaseStatus: 'connected' | 'missing_tables' | 'error' | 'not_configured' = 'not_configured';
    let supabaseError: string | null = null;

    if (sb) {
      const { error } = await sb.from('site_settings').select('id').limit(1);
      if (!error) {
        supabaseStatus = 'connected';
      } else if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message.toLowerCase().includes('could not find the table') ||
        error.message.toLowerCase().includes('does not exist')
      ) {
        supabaseStatus = 'missing_tables';
        supabaseError = 'Tabelas ainda não criadas no Supabase. Execute supabase/schema.sql no SQL Editor.';
      } else {
        supabaseStatus = 'error';
        supabaseError = error.message;
      }
    }

    const products = await getProducts();
    return NextResponse.json({
      ok: true,
      service: 'concretando-nextjs-api',
      database: engine,
      supabaseStatus,
      supabaseError,
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
