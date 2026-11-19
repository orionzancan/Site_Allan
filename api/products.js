const { getSupabaseClient, handleCors, sendJson, requireApiKey } = require('./_lib/supabase');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const supabase = getSupabaseClient();
  if (!supabase) {
    return sendJson(res, 503, {
      ok: false,
      code: 'SUPABASE_NOT_CONFIGURED',
      message: 'Supabase não configurado no servidor. O frontend continuará operando no Banco de Dados Local.'
    });
  }

  if (req.method === 'GET') {
    const { category, promo, search } = req.query || {};
    let query = supabase.from('products').select('*').eq('active', true).order('is_promo', { ascending: false });

    if (category && category !== 'todos') {
      query = query.eq('category', category);
    }
    if (promo === 'true') {
      query = query.eq('is_promo', true);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) return sendJson(res, 500, { ok: false, error: error.message });
    return sendJson(res, 200, { ok: true, data });
  }

  if (req.method === 'POST') {
    if (!requireApiKey(req)) {
      return sendJson(res, 401, { ok: false, error: 'X-API-Key inválida.' });
    }
    const body = req.body || {};
    if (!body.id || !body.sku || !body.name || !body.category || body.price == null) {
      return sendJson(res, 400, { ok: false, error: 'Campos obrigatórios: id, sku, name, category, price.' });
    }
    const { data, error } = await supabase.from('products').upsert([body]).select().single();
    if (error) return sendJson(res, 500, { ok: false, error: error.message });
    return sendJson(res, 201, { ok: true, data });
  }

  return sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
};
