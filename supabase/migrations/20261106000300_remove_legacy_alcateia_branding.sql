-- Decode Analytics: enforce the Decode logo and remove legacy Alcateia storefront identity.
-- This migration intentionally updates only company branding/content fields.
UPDATE public.company_settings
SET
  name = CASE
    WHEN name ILIKE '%alcateia%' THEN 'Decode Analytics'
    ELSE name
  END,
  logo_url = '/brand/decode-logo.png',
  instagram = CASE
    WHEN lower(trim(COALESCE(instagram, ''))) IN ('@alcateiasproducoesgraficas', 'alcateiasproducoesgraficas')
      THEN NULL
    ELSE instagram
  END,
  default_quote_text = replace(
    COALESCE(default_quote_text, ''),
    'Alcateia''s Produções Gráficas',
    'Decode Analytics'
  ),
  hero_subtitle = CASE
    WHEN hero_subtitle ILIKE '%alcateia%' OR hero_subtitle ILIKE '%gráfica que uiva%'
      THEN 'Design, tecnologia e soluções personalizadas com atendimento próximo.'
    ELSE hero_subtitle
  END,
  contact_title = CASE
    WHEN contact_title ILIKE '%alcateia%' THEN 'Fale com a Decode Analytics'
    ELSE contact_title
  END,
  updated_at = now();

ALTER TABLE public.company_settings
  ALTER COLUMN name SET DEFAULT 'Decode Analytics',
  ALTER COLUMN logo_url SET DEFAULT '/brand/decode-logo.png';
