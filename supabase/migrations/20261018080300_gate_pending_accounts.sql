-- Existing accounts keep their roles. New accounts receive limited access and
-- must be approved by an administrator before using staff functionality.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('public.handle_new_user:bootstrap-admin')::bigint);

  INSERT INTO public.profiles(id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;

  -- Keep the first-account bootstrap for a fresh installation. All later public
  -- registrations are pending, and the legacy Alcateia email no longer grants admin.
  IF is_first THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (NEW.id, 'administrador')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles(user_id, role)
    VALUES (NEW.id, 'aguardando_aprovacao')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Restrict the briefing tables that were initially granted to every authenticated
-- account. Pending self-registrations must not read or alter customer work.
DROP POLICY IF EXISTS "briefing_links_staff" ON public.briefing_links;
DROP POLICY IF EXISTS "client_briefings_staff" ON public.client_briefings;
DROP POLICY IF EXISTS "briefing_files_staff" ON public.briefing_files;
DROP POLICY IF EXISTS "art_versions_staff" ON public.art_versions;
DROP POLICY IF EXISTS "art_comments_staff" ON public.art_comments;

CREATE POLICY "briefing_links_staff_roles" ON public.briefing_links FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  );

CREATE POLICY "client_briefings_staff_roles" ON public.client_briefings FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  );

CREATE POLICY "briefing_files_staff_roles" ON public.briefing_files FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  );

CREATE POLICY "art_versions_staff_roles" ON public.art_versions FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  );

CREATE POLICY "art_comments_staff_roles" ON public.art_comments FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  );

-- Company settings can contain internal business data. Storefront requests use
-- the public anon role and do not depend on this authenticated-only policy.
DROP POLICY IF EXISTS "cs_read" ON public.company_settings;
CREATE POLICY "cs_read_staff" ON public.company_settings FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  );
