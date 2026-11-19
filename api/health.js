const { getSupabaseClient, handleCors, sendJson } = require('./_lib/supabase');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const supabase = getSupabaseClient();
  if (!supabase) {
    return sendJson(res, 200, {
      ok: true,
      service: 'concretando-api',
      database: 'unconfigured',
      message: 'API Vercel ativa. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para persistência em nuvem.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return sendJson(res, 200, {
      ok: true,
      service: 'concretando-api',
      database: 'supabase',
      productsCount: count ?? 0,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return sendJson(res, 500, {
      ok: false,
      database: 'supabase_error',
      error: err.message
    });
  }
};
