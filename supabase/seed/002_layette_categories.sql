-- =============================================================
-- Baby Journey — Categorias do Enxoval
-- =============================================================

CREATE TABLE IF NOT EXISTS public.layette_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '📦',
  color      TEXT NOT NULL DEFAULT '#7c3aed',
  sort_order INT NOT NULL DEFAULT 0
);

-- Habilitar RLS (acesso público de leitura — catálogo global)
ALTER TABLE public.layette_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "layette_categories_public_read" ON public.layette_categories;
CREATE POLICY "layette_categories_public_read" ON public.layette_categories
  FOR SELECT USING (true);

INSERT INTO public.layette_categories (slug, name, icon, color, sort_order) VALUES
  ('quarto',      'Quarto',                   '🛏️',  '#7c3aed', 10),
  ('sono',        'Sono',                     '🌙',  '#6366f1', 20),
  ('passeio',     'Passeio',                  '🚶',  '#0ea5e9', 30),
  ('seguranca',   'Segurança',                '🛡️',  '#f59e0b', 40),
  ('alimentacao', 'Alimentação',              '🍼',  '#22c55e', 50),
  ('amamentacao', 'Amamentação',              '🤱',  '#ec4899', 60),
  ('higiene',     'Higiene',                  '🧴',  '#06b6d4', 70),
  ('banho',       'Banho',                    '🛁',  '#3b82f6', 80),
  ('saude',       'Saúde',                    '❤️',  '#ef4444', 90),
  ('roupas',      'Roupas',                   '👕',  '#f97316', 100),
  ('brinquedos',  'Brinquedos & Des.',        '🧸',  '#8b5cf6', 110),
  ('maternidade', 'Maternidade',              '🏥',  '#14b8a6', 120),
  ('pos_parto',   'Pós-parto',               '🌸',  '#d946ef', 130),
  ('documentos',  'Documentos',              '📄',  '#64748b', 140),
  ('mudanca',     'Mudança Internacional',    '✈️',  '#0f172a', 150)
ON CONFLICT (slug) DO UPDATE SET
  name       = EXCLUDED.name,
  icon       = EXCLUDED.icon,
  color      = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;
