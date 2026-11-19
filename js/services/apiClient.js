(function (global) {
  'use strict';

  const Concretando = (global.Concretando = global.Concretando || {});

  /**
   * Camada de Integração de APIs Externas e Internas (Plug & Play)
   * Facilita conectar ViaCEP, WhatsApp, ERPs, Gateways de Pagamento e Webhooks.
   */
  const apiClient = {
    async lookupCep(rawCep) {
      const cep = String(rawCep || '').replace(/\D/g, '');
      if (cep.length !== 8) {
        throw new Error('Digite um CEP válido com 8 dígitos.');
      }

      const url = `${Concretando.config.viaCepUrl}/${cep}/json/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao consultar ViaCEP.');
      const data = await res.json();
      if (data.erro) throw new Error('CEP não encontrado.');

      return {
        cep: data.cep,
        address: [data.logradouro, data.bairro].filter(Boolean).join(' - '),
        city: data.localidade,
        state: data.uf
      };
    },

    estimateShipping(cep, subtotal) {
      if (subtotal >= Concretando.config.freeShippingThreshold) {
        return { cost: 0, days: '2 a 3 dias úteis', freeReason: 'Frete Grátis acima de R$ 1.800' };
      }
      const clean = String(cep || '').replace(/\D/g, '');
      if (clean.startsWith('0') || clean.startsWith('1')) {
        return { cost: 89.90, days: '1 a 2 dias úteis (Frota Própria SP)' };
      }
      return { cost: 149.90, days: '3 a 5 dias úteis (Transportadora)' };
    },

    buildWhatsAppQuoteUrl(quote) {
      const num = Concretando.config.whatsappNumber;
      const msg = [
        `Olá equipe *CONCRETANDO*! Fiz uma cotação por m² no site:`,
        `• Código: ${quote.quote_code || 'Rascunho'}`,
        `• Material: ${quote.product_name}`,
        `• Área informada: ${quote.area_m2} m² (+${quote.loss_pct}% perda técnica = ${quote.total_area_with_loss} m²)`,
        `• Quantidade calculada: ${quote.calculated_quantity} ${quote.unit}`,
        `• Valor estimado: ${formatBRL(quote.estimated_total)}`,
        `• Modalidade: ${quote.delivery_mode === 'pickup' ? 'Retirada na Loja (Grátis)' : 'Entrega na Obra'}`
      ].join('\n');
      return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
    },

    async testEndpoint(endpointPath) {
      const base = Concretando.config.apiBaseUrl.replace(/\/$/, '');
      const started = performance.now();
      const res = await fetch(`${base}${endpointPath}`);
      const elapsed = Math.round(performance.now() - started);
      const body = await res.json().catch(() => ({ raw: 'Resposta não-JSON' }));
      return { status: res.status, ok: res.ok, elapsedMs: elapsed, body };
    }
  };

  function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value || 0));
  }

  Concretando.apiClient = apiClient;
  Concretando.formatBRL = formatBRL;
})(window);
