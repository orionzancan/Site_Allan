const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function handleCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

function sendJson(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function requireApiKey(req) {
  const configured = process.env.CONCRETANDO_API_KEY;
  if (!configured) return true;
  const provided = req.headers['x-api-key'] || '';
  return provided === configured;
}

async function dispatchWebhook(event, data) {
  const url = process.env.WEBHOOK_ORDERS_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, timestamp: new Date().toISOString(), data })
    });
  } catch (err) {
    console.warn('[CONCRETANDO Webhook] Falha ao notificar:', err.message);
  }
}

module.exports = {
  getSupabaseClient,
  handleCors,
  sendJson,
  requireApiKey,
  dispatchWebhook
};
