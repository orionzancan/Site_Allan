import type { Product, SiteSettings } from '@/types';

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

export interface M2CalculationResult {
  product_id: string;
  product_name: string;
  unit: string;
  width_m: number | null;
  length_m: number | null;
  area_m2: number;
  loss_pct: number;
  total_area_with_loss: number;
  calculated_quantity: number;
  unit_price: number;
  estimated_total: number;
  pix_total: number;
  price_per_m2: number;
}

export function calculateM2(params: {
  product: Product;
  mode: 'dimensions' | 'area';
  width: number;
  length: number;
  directArea: number;
  lossPct: number;
  pixDiscountPct: number;
}): M2CalculationResult | null {
  const { product, mode, width, length, directArea, lossPct, pixDiscountPct } = params;

  const area = mode === 'dimensions' ? width * length : directArea;
  if (!Number.isFinite(area) || area <= 0) return null;

  const safeLoss = Math.max(0, Math.min(35, Number(lossPct || 0)));
  const totalAreaWithLoss = area * (1 + safeLoss / 100);
  const unitsPerM2 = Number(product.m2_units_per_m2 || 1);
  const calculatedQuantity = Math.max(1, Math.ceil(totalAreaWithLoss * unitsPerM2));
  const estimatedTotal = Number((calculatedQuantity * product.price).toFixed(2));
  const pixTotal = Number((estimatedTotal * (1 - pixDiscountPct / 100)).toFixed(2));
  const pricePerM2 = Number((estimatedTotal / area).toFixed(2));

  return {
    product_id: product.id,
    product_name: product.name,
    unit: product.unit,
    width_m: mode === 'dimensions' ? Number(width.toFixed(2)) : null,
    length_m: mode === 'dimensions' ? Number(length.toFixed(2)) : null,
    area_m2: Number(area.toFixed(2)),
    loss_pct: safeLoss,
    total_area_with_loss: Number(totalAreaWithLoss.toFixed(2)),
    calculated_quantity: calculatedQuantity,
    unit_price: product.price,
    estimated_total: estimatedTotal,
    pix_total: pixTotal,
    price_per_m2: pricePerM2
  };
}

export function estimateShipping(cep: string, subtotal: number, settings: SiteSettings) {
  if (subtotal >= settings.free_shipping_threshold) {
    return { cost: 0, label: 'Frete Grátis (acima do mínimo)' };
  }
  const digits = cep.replace(/\D/g, '');
  if (digits.startsWith('0') || digits.startsWith('1')) {
    return { cost: settings.shipping_capital_fee, label: 'Frota Própria SP (1-2 dias úteis)' };
  }
  return { cost: settings.shipping_other_fee, label: 'Transportadora (3-5 dias úteis)' };
}

export function darkenHex(hex: string, amount = 32): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#960d12';
  const num = parseInt(clean, 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function hexToRgbChannels(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '207 20 27';
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `${r} ${g} ${b}`;
}
