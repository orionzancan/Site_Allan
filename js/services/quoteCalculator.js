(function (global) {
  'use strict';

  const Concretando = (global.Concretando = global.Concretando || {});

  /**
   * Calculadora Técnica de Cotação por Metro Quadrado (m²)
   * Calcula área líquida, margem de perda técnica, quantidade exata de compra e custo.
   */
  function calculateM2Quote({ product, mode, width, length, directArea, lossPct }) {
    if (!product) {
      throw new Error('Selecione um material para calcular.');
    }

    let area = 0;
    let widthVal = null;
    let lengthVal = null;

    if (mode === 'dimensions') {
      widthVal = Number(width);
      lengthVal = Number(length);
      if (!(widthVal > 0) || !(lengthVal > 0)) {
        throw new Error('Informe largura e comprimento/altura maiores que zero.');
      }
      area = widthVal * lengthVal;
    } else {
      area = Number(directArea);
      if (!(area > 0)) {
        throw new Error('Informe uma área total em m² maior que zero.');
      }
    }

    const safeLoss = Math.max(0, Math.min(35, Number(lossPct ?? product.m2_default_loss_pct ?? 10)));
    const areaWithLoss = area * (1 + safeLoss / 100);
    const unitsPerM2 = Number(product.m2_units_per_m2 || 1);
    const rawUnits = areaWithLoss * unitsPerM2;
    const calculatedQuantity = Math.max(1, Math.ceil(rawUnits));
    const unitPrice = Number(product.price || 0);
    const estimatedTotal = calculatedQuantity * unitPrice;
    const pixTotal = estimatedTotal * (1 - (Concretando.config.pixDiscountPct || 5) / 100);
    const pricePerM2 = estimatedTotal / area;

    return {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      unit: product.unit,
      units_per_m2: unitsPerM2,
      application: product.m2_application || '',
      width_m: widthVal ? Number(widthVal.toFixed(2)) : null,
      length_m: lengthVal ? Number(lengthVal.toFixed(2)) : null,
      area_m2: Number(area.toFixed(2)),
      loss_pct: safeLoss,
      total_area_with_loss: Number(areaWithLoss.toFixed(2)),
      calculated_quantity: calculatedQuantity,
      unit_price: unitPrice,
      estimated_total: Number(estimatedTotal.toFixed(2)),
      pix_total: Number(pixTotal.toFixed(2)),
      price_per_m2: Number(pricePerM2.toFixed(2))
    };
  }

  Concretando.quoteCalculator = { calculateM2Quote };
})(window);
