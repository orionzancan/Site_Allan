const { getSupabaseClient, handleCors, sendJson, dispatchWebhook } = require('./_lib/supabase');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const supabase = getSupabaseClient();
  if (!supabase) {
    return sendJson(res, 503, {
      ok: false,
      code: 'SUPABASE_NOT_CONFIGURED',
      message: 'Supabase não configurado no servidor.'
    });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return sendJson(res, 500, { ok: false, error: error.message });
    return sendJson(res, 200, { ok: true, data });
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.product_name || !b.area_m2 || !b.calculated_quantity) {
      return sendJson(res, 400, { ok: false, error: 'Dados incompletos para salvar cotação por m².' });
    }

    const quoteCode = b.quote_code || `COT-${Date.now().toString(36).toUpperCase()}`;
    const record = {
      quote_code: quoteCode,
      customer_name: b.customer_name || 'Cliente Visitante',
      customer_email: b.customer_email || null,
      customer_phone: b.customer_phone || null,
      product_id: b.product_id || null,
      product_name: b.product_name,
      width_m: b.width_m ?? null,
      length_m: b.length_m ?? null,
      area_m2: Number(b.area_m2),
      loss_pct: Number(b.loss_pct ?? 10),
      total_area_with_loss: Number(b.total_area_with_loss ?? b.area_m2),
      calculated_quantity: Number(b.calculated_quantity),
      unit: b.unit || 'un',
      unit_price: Number(b.unit_price ?? 0),
      estimated_total: Number(b.estimated_total ?? 0),
      delivery_mode: b.delivery_mode === 'delivery' ? 'delivery' : 'pickup',
      store_id: b.store_id || null,
      notes: b.notes || null,
      status: 'aberta'
    };

    const { data, error } = await supabase.from('quotes').insert([record]).select().single();
    if (error) return sendJson(res, 500, { ok: false, error: error.message });

    await dispatchWebhook('quote.created', data);
    return sendJson(res, 201, { ok: true, data });
  }

  return sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
};
