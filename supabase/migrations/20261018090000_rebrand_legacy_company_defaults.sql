-- Replace only legacy defaults and seeded values. Preserve settings already
-- customized for Decode Analytics.
ALTER TABLE public.company_settings
  ALTER COLUMN name SET DEFAULT 'Decode Analytics',
  ALTER COLUMN whatsapp SET DEFAULT '5511939222885',
  ALTER COLUMN instagram SET DEFAULT NULL,
  ALTER COLUMN logo_url SET DEFAULT '/brand/decode-logo.png';

UPDATE public.company_settings
SET
  name = CASE
    WHEN name ILIKE '%alcateia%' THEN 'Decode Analytics — Design & Soluções'
    ELSE name
  END,
  whatsapp = CASE
    WHEN regexp_replace(COALESCE(whatsapp, ''), '[^0-9]', '', 'g') IN ('5511972235342', '11972235342')
      THEN '5511939222885'
    ELSE whatsapp
  END,
  instagram = CASE
    WHEN lower(trim(COALESCE(instagram, ''))) IN ('@alcateiasproducoesgraficas', 'alcateiasproducoesgraficas')
      THEN NULL
    ELSE instagram
  END,
  logo_url = CASE
    WHEN logo_url ILIKE '%alcateia%' THEN '/brand/decode-logo.png'
    ELSE logo_url
  END,
  default_quote_text = replace(default_quote_text, 'Alcateia''s Produções Gráficas', 'Decode Analytics — Design & Soluções'),
  hero_title = CASE
    WHEN hero_title = 'IMPRESSÃO<br />PRODUÇÕES GRÁFICAS' THEN 'DESIGN, TECNOLOGIA<br />& IMPRESSÃO'
    ELSE hero_title
  END,
  hero_subtitle = CASE
    WHEN hero_subtitle ILIKE '%alcateia%' THEN 'Design, manutenção de computadores, social media, programação e produtos gráficos com atendimento próximo e soluções sob medida.'
    ELSE hero_subtitle
  END,
  bento_kicker = CASE
    WHEN bento_kicker ILIKE '%imbatíveis%' THEN 'Soluções Decode'
    ELSE bento_kicker
  END,
  bento_title = CASE
    WHEN bento_title = 'MAIS PEDIDOS DA GRÁFICA' THEN 'PRODUTOS E SERVIÇOS'
    ELSE bento_title
  END,
  bento_description = CASE
    WHEN bento_description ILIKE '%direto da nossa produção%' THEN 'Explore nossas soluções e peça um orçamento sob medida.'
    ELSE bento_description
  END,
  contact_title = CASE
    WHEN contact_title ILIKE '%alcateia%' THEN 'Fale com a Decode Analytics'
    ELSE contact_title
  END,
  updated_at = now()
WHERE name ILIKE '%alcateia%'
   OR regexp_replace(COALESCE(whatsapp, ''), '[^0-9]', '', 'g') IN ('5511972235342', '11972235342')
   OR lower(trim(COALESCE(instagram, ''))) IN ('@alcateiasproducoesgraficas', 'alcateiasproducoesgraficas')
   OR logo_url ILIKE '%alcateia%'
   OR default_quote_text ILIKE '%alcateia%'
   OR hero_title = 'IMPRESSÃO<br />PRODUÇÕES GRÁFICAS'
   OR hero_subtitle ILIKE '%alcateia%'
   OR bento_kicker ILIKE '%imbatíveis%'
   OR bento_title = 'MAIS PEDIDOS DA GRÁFICA'
   OR bento_description ILIKE '%direto da nossa produção%'
   OR contact_title ILIKE '%alcateia%';
