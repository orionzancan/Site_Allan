-- ============================================================================
-- CONCRETANDO (Next.js + Node.js + Supabase + Vercel)
-- Schema PostgreSQL Completo com Configurações Globais do Admin
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. CONFIGURAÇÕES GLOBAIS DO SITE (EDITÁVEIS APENAS PELO ADMIN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  brand_name TEXT NOT NULL DEFAULT 'CONCRETANDO',
  slogan TEXT NOT NULL DEFAULT 'criando laços e casa',
  primary_color TEXT NOT NULL DEFAULT '#cf141b',
  promo_ribbon_text TEXT NOT NULL DEFAULT '🔥 Promoções de Fábrica • Retirada Grátis em até 2h',
  hero_eyebrow TEXT NOT NULL DEFAULT 'Do alicerce ao acabamento • Estoque imediato',
  hero_title TEXT NOT NULL DEFAULT 'Construa com preço direto de fábrica e retirada expressa',
  hero_subtitle TEXT NOT NULL DEFAULT 'Calcule a quantidade exata de blocos, aço, telhas, cimento e porcelanatos por metro quadrado (m²) e retire grátis na loja ou receba direto na obra.',
  hero_cta_label TEXT NOT NULL DEFAULT 'Calcular Cotação por m²',
  whatsapp_number TEXT NOT NULL DEFAULT '5511999999999',
  contact_email TEXT NOT NULL DEFAULT 'vendas@concretando.com.br',
  contact_phone TEXT NOT NULL DEFAULT '(11) 3456-7890',
  pix_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 5.0,
  free_shipping_threshold NUMERIC(12, 2) NOT NULL DEFAULT 1800.0,
  shipping_capital_fee NUMERIC(12, 2) NOT NULL DEFAULT 89.90,
  shipping_other_fee NUMERIC(12, 2) NOT NULL DEFAULT 149.90,
  pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. PRODUTOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'un',
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(12, 2),
  is_promo BOOLEAN NOT NULL DEFAULT FALSE,
  promo_badge TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  pickup_ready BOOLEAN NOT NULL DEFAULT TRUE,
  pickup_time_label TEXT DEFAULT 'Retire em 2h',
  m2_supported BOOLEAN NOT NULL DEFAULT TRUE,
  m2_units_per_m2 NUMERIC(10, 4) DEFAULT 1,
  m2_default_loss_pct NUMERIC(5, 2) DEFAULT 10.0,
  m2_application TEXT,
  image_url TEXT,
  short_description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_promo ON public.products (is_promo);

-- ----------------------------------------------------------------------------
-- 3. UNIDADES FÍSICAS (RETIRADA NA LOJA)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  cep TEXT NOT NULL,
  phone TEXT NOT NULL,
  hours TEXT NOT NULL,
  pickup_dock_info TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. COTAÇÕES POR METRO QUADRADO (m²)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_code TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  width_m NUMERIC(10, 2),
  length_m NUMERIC(10, 2),
  area_m2 NUMERIC(12, 2) NOT NULL CHECK (area_m2 > 0),
  loss_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
  total_area_with_loss NUMERIC(12, 2) NOT NULL,
  calculated_quantity INTEGER NOT NULL CHECK (calculated_quantity > 0),
  unit TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  estimated_total NUMERIC(12, 2) NOT NULL,
  delivery_mode TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_mode IN ('pickup', 'delivery')),
  store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'aprovada', 'convertida', 'expirada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. PEDIDOS (RETIRADA NA LOJA & ENTREGA NA OBRA)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE NOT NULL,
  pickup_code TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_document TEXT,
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('pickup', 'delivery')),
  store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
  store_name TEXT,
  pickup_date TEXT,
  pickup_slot TEXT,
  delivery_cep TEXT,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  subtotal NUMERIC(12, 2) NOT NULL,
  shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('pendente', 'confirmado', 'separacao', 'pronto_retirada', 'em_transporte', 'concluido', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. MENSAGENS DE CONTATO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nova',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de configurações" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "Leitura pública de produtos" ON public.products FOR SELECT USING (active = TRUE);
CREATE POLICY "Leitura pública de lojas" ON public.stores FOR SELECT USING (active = TRUE);
CREATE POLICY "Criar cotação pública" ON public.quotes FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Criar pedido público" ON public.orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Criar contato público" ON public.contact_messages FOR INSERT WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- 8. DADOS INICIAIS (SEED)
-- ----------------------------------------------------------------------------
INSERT INTO public.site_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stores (id, name, address, city, state, cep, phone, hours, pickup_dock_info)
VALUES
  ('loja-matriz', 'Concretando Matriz — Centro Industrial', 'Av. das Construções, 1450 - Galpão A', 'São Paulo', 'SP', '01140-000', '(11) 3456-7890', 'Seg a Sáb: 07h às 19h', 'Doca Drive-Thru com empilhadeira para carga rápida'),
  ('loja-zona-sul', 'Concretando Unidade Sul — Interlagos', 'Av. Interlagos, 3820 - Jardim Marajoara', 'São Paulo', 'SP', '04660-005', '(11) 3456-7891', 'Seg a Sáb: 07h30 às 18h30', 'Retirada Expressa no Pátio Coberto 2'),
  ('loja-campinas', 'Concretando Hub Campinas', 'Rod. Dom Pedro I, Km 134 - Parque Brasil', 'Campinas', 'SP', '13098-000', '(19) 3210-4455', 'Seg a Sex: 07h às 18h | Sáb: 08h às 14h', 'Estacionamento amplo para caminhões e utilitários')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (
  id, sku, name, category, unit, price, original_price, is_promo, promo_badge,
  stock, pickup_ready, pickup_time_label, m2_supported, m2_units_per_m2,
  m2_default_loss_pct, m2_application, image_url, short_description
)
VALUES
  ('prod-tijolo-8f', 'CON-TIJ-008', 'Bloco Cerâmico 8 Furos 9x19x19cm', 'alvenaria', 'un', 1.29, 1.59, TRUE, '-19% OFERTA', 48000, TRUE, 'Retire em 1h', TRUE, 25, 10, 'Alvenaria de vedação (25 un/m²)', '/images/cat-tijolos.jpg', 'Tijolo cerâmico cozido de alta resistência térmica e acústica, padrão NBR 15270.'),
  ('prod-bloco-estrutural', 'CON-BLC-014', 'Bloco de Concreto Estrutural 14x19x39cm', 'alvenaria', 'un', 5.40, 6.20, TRUE, 'ESTRUTURAL', 15200, TRUE, 'Retire em 2h', TRUE, 12.5, 8, 'Alvenaria estrutural e muros (12,5 un/m²)', '/images/cat-tijolos.jpg', 'Bloco estrutural classe A para muros, sobrados e obras de alto desempenho.'),
  ('prod-vergalhao-10', 'CON-ACO-010', 'Vergalhão Aço CA-50 10mm (3/8") Barra 12m', 'aco', 'barra', 54.90, 64.90, TRUE, 'DIRETO DA USINA', 1200, TRUE, 'Retire em 2h', TRUE, 0.85, 10, 'Armação de lajes e vigas (~0,85 barra/m²)', '/images/cat-vergalhao.jpg', 'Aço nervurado CA-50 soldável de altíssima aderência ao concreto.'),
  ('prod-vergalhao-8', 'CON-ACO-008', 'Vergalhão Aço CA-50 8mm (5/16") Barra 12m', 'aco', 'barra', 36.50, 41.00, FALSE, NULL, 1850, TRUE, 'Retire em 2h', TRUE, 0.70, 10, 'Estribos, cintas e malhas (~0,70 barra/m²)', '/images/cat-vergalhao.jpg', 'Barra de 12 metros certificada para colunas, cintas e vigas residenciais.'),
  ('prod-telha-portuguesa', 'CON-TEL-001', 'Telha Cerâmica Portuguesa Mesclada Resina', 'cobertura', 'un', 3.35, 3.95, TRUE, '-15% TELHADO', 22000, TRUE, 'Retire em 2h', TRUE, 17, 8, 'Cobertura inclinação padrão (17 telhas/m²)', '/images/cat-telhas-pisos.jpg', 'Telha cerâmica hidrofugada com encaixe perfeito e proteção antimofo.'),
  ('prod-porcelanato-cimento', 'CON-PIS-090', 'Porcelanato Retificado Cimento Queimado 80x80cm', 'acabamento', 'm²', 79.90, 96.00, TRUE, 'MAIS VENDIDO', 3400, TRUE, 'Retire em 1h', TRUE, 1, 10, 'Pisos internos e áreas gourmet (1 m²/m²)', '/images/cat-telhas-pisos.jpg', 'Acabamento acetinado borda retificada, junta mínima de 2mm, alto tráfego.'),
  ('prod-cimento-cp2', 'CON-CIM-050', 'Cimento Portland CP II-F-32 Saco 50kg', 'basicos', 'sc', 33.90, 37.50, TRUE, 'PROMOÇÃO', 2600, TRUE, 'Retire em 30min', TRUE, 0.25, 10, 'Contrapiso ou reboco 3cm (~0,25 saco/m²)', '/images/hero-warehouse.jpg', 'Cimento multiuso de secagem equilibrada para lajes, contrapisos e rebocos.'),
  ('prod-argamassa-ac3', 'CON-ARG-020', 'Argamassa Colante AC-III Flexível Cinza 20kg', 'acabamento', 'sc', 34.50, 39.90, FALSE, NULL, 980, TRUE, 'Retire em 30min', TRUE, 0.25, 10, 'Assentamento de porcelanatos (~4 m² por saco)', '/images/cat-telhas-pisos.jpg', 'Alta aderência para porcelanatos de grandes formatos, fachadas e áreas úmidas.'),
  ('prod-telha-fibrocimento', 'CON-TEL-244', 'Telha Fibrocimento Ondulada 6mm 2,44x1,10m', 'cobertura', 'un', 68.90, 78.00, TRUE, 'ECONOMIA', 840, TRUE, 'Retire em 1h', TRUE, 0.45, 8, 'Galpões e coberturas leves (~0,45 telha/m²)', '/images/hero-warehouse.jpg', 'Telha sem amianto de alta durabilidade, instalação rápida e leve.'),
  ('prod-malha-pop', 'CON-ACO-POP', 'Tela Soldada Malha Pop 15x15cm (2x3m) 4,2mm', 'aco', 'painel', 72.00, 82.00, FALSE, NULL, 610, TRUE, 'Retire em 2h', TRUE, 0.18, 10, 'Pisos de concreto e lajes (~6 m² por painel)', '/images/cat-vergalhao.jpg', 'Evita fissuras em contrapisos, calçadas e lajes com armadura uniforme.')
ON CONFLICT (id) DO NOTHING;
