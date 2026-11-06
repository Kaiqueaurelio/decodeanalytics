-- Decode Analytics: remove known legacy Alcateia logo paths from company settings.
-- Preserve other custom logos; only replace assets known to belong to Alcateia'S.
UPDATE public.company_settings
SET logo_url = '/brand/decode-logo.png',
    updated_at = now()
WHERE logo_url IS NOT NULL
  AND (
    logo_url ILIKE '%alcateia%'
    OR logo_url ILIKE '%/brand/logo-full.png'
    OR logo_url ILIKE '%/brand/alcateia-logo.png'
    OR logo_url ILIKE '%/brand/alcateia-symbol.png'
  );

ALTER TABLE public.company_settings
  ALTER COLUMN logo_url SET DEFAULT '/brand/decode-logo.png';
