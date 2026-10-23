-- Private storage for repair intake evidence. Photos contain customer device data.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('technical-order-photos', 'technical-order-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "technical_order_photos_read" ON storage.objects;
CREATE POLICY "technical_order_photos_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'technical-order-photos'
  AND (public.is_admin((SELECT auth.uid()))
    OR public.has_role('atendente'::public.app_role, (SELECT auth.uid()))
    OR public.has_role('producao'::public.app_role, (SELECT auth.uid())))
);

DROP POLICY IF EXISTS "technical_order_photos_insert" ON storage.objects;
CREATE POLICY "technical_order_photos_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'technical-order-photos'
  AND (public.is_admin((SELECT auth.uid()))
    OR public.has_role('atendente'::public.app_role, (SELECT auth.uid())))
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id::text = (storage.foldername(name))[1]
      AND o.service_segment = 'tecnologia'
  )
);

DROP POLICY IF EXISTS "technical_order_photos_delete" ON storage.objects;
CREATE POLICY "technical_order_photos_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'technical-order-photos'
  AND (public.is_admin((SELECT auth.uid()))
    OR public.has_role('atendente'::public.app_role, (SELECT auth.uid())))
);
