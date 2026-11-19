const { getSupabaseClient, handleCors, sendJson } = require('./_lib/supabase');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
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

  const b = req.body || {};
  if (!b.name || !b.email || !b.message) {
    return sendJson(res, 400, { ok: false, error: 'Nome, e-mail e mensagem são obrigatórios.' });
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .insert([{
      name: b.name,
      email: b.email,
      phone: b.phone || null,
      subject: b.subject || 'Orçamento / Atendimento',
      message: b.message
    }])
    .select()
    .single();

  if (error) return sendJson(res, 500, { ok: false, error: error.message });
  return sendJson(res, 201, { ok: true, data });
};
