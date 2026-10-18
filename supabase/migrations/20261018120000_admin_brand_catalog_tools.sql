-- Admin tools for Decode Analytics brand settings and product photos.
-- This migration is committed to the repository; apply it to the verified production Supabase project before release.

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS primary_color text NOT NULL DEFAULT '#2563EB',
  ADD COLUMN IF NOT EXISTS secondary_color text NOT NULL DEFAULT '#7C3AED',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#38BDF8';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalog-images',
  'catalog-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Catalog images are publicly readable" ON storage.objects;
CREATE POLICY "Catalog images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catalog-images');

DROP POLICY IF EXISTS "Administrators upload catalog images" ON storage.objects;
CREATE POLICY "Administrators upload catalog images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'catalog-images'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'administrador'
    )
  );

DROP POLICY IF EXISTS "Administrators update catalog images" ON storage.objects;
CREATE POLICY "Administrators update catalog images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'catalog-images'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'administrador'
    )
  )
  WITH CHECK (
    bucket_id = 'catalog-images'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'administrador'
    )
  );

DROP POLICY IF EXISTS "Administrators delete catalog images" ON storage.objects;
CREATE POLICY "Administrators delete catalog images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'catalog-images'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'administrador'
    )
  );
