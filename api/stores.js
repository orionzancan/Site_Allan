const { getSupabaseClient, handleCors, sendJson } = require('./_lib/supabase');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return sendJson(res, 503, {
      ok: false,
      code: 'SUPABASE_NOT_CONFIGURED',
      message: 'Supabase não configurado no servidor.'
    });
  }

  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) return sendJson(res, 500, { ok: false, error: error.message });
  return sendJson(res, 200, { ok: true, data });
};
