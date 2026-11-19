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
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return sendJson(res, 500, { ok: false, error: error.message });
    return sendJson(res, 200, { ok: true, data });
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.customer_name || !b.customer_email || !b.customer_phone || !Array.isArray(b.items) || b.items.length === 0) {
      return sendJson(res, 400, { ok: false, error: 'Dados do cliente e itens do pedido são obrigatórios.' });
    }

    const fulfillment = b.fulfillment_type === 'delivery' ? 'delivery' : 'pickup';
    const orderCode = b.order_code || `PED-${Date.now().toString(36).toUpperCase()}`;
    const pickupCode = fulfillment === 'pickup'
      ? (b.pickup_code || `RET-${Math.floor(100000 + Math.random() * 900000)}`)
      : null;

    const record = {
      order_code: orderCode,
      pickup_code: pickupCode,
      customer_name: b.customer_name,
      customer_email: b.customer_email,
      customer_phone: b.customer_phone,
      customer_document: b.customer_document || null,
      fulfillment_type: fulfillment,
      store_id: fulfillment === 'pickup' ? (b.store_id || 'loja-matriz') : null,
      store_name: fulfillment === 'pickup' ? (b.store_name || null) : null,
      pickup_date: fulfillment === 'pickup' ? (b.pickup_date || null) : null,
      pickup_slot: fulfillment === 'pickup' ? (b.pickup_slot || null) : null,
      delivery_cep: fulfillment === 'delivery' ? (b.delivery_cep || null) : null,
      delivery_address: fulfillment === 'delivery' ? (b.delivery_address || null) : null,
      delivery_city: fulfillment === 'delivery' ? (b.delivery_city || null) : null,
      delivery_state: fulfillment === 'delivery' ? (b.delivery_state || null) : null,
      payment_method: b.payment_method || 'pix',
      subtotal: Number(b.subtotal ?? 0),
      shipping_cost: Number(b.shipping_cost ?? 0),
      discount: Number(b.discount ?? 0),
      total: Number(b.total ?? 0),
      items: b.items,
      status: fulfillment === 'pickup' ? 'separacao' : 'confirmado'
    };

    const { data, error } = await supabase.from('orders').insert([record]).select().single();
    if (error) return sendJson(res, 500, { ok: false, error: error.message });

    await dispatchWebhook('order.created', data);
    return sendJson(res, 201, { ok: true, data });
  }

  return sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
};
