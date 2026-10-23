-- Keep the owner account's administrator assignment reproducible across environments.
-- Role assignment is explicit and limited to the verified owner account; signups do not
-- receive elevated access automatically.

DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT id
    INTO owner_id
    FROM auth.users
   WHERE lower(email) = lower('decoanalytics@outlook.com.br')
   LIMIT 1;

  IF owner_id IS NULL THEN
    RAISE NOTICE 'Owner account not present yet; administrator assignment skipped.';
    RETURN;
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    UPDATE public.profiles
       SET role = 'administrador',
           is_active = true
     WHERE id = owner_id;

    -- If this account has no profile row yet, create one using only columns
    -- confirmed by the current Decode Analytics profile schema.
    IF NOT FOUND THEN
      INSERT INTO public.profiles (id, email, role, is_active)
      VALUES (owner_id, 'decoanalytics@outlook.com.br', 'administrador', true)
      ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            role = 'administrador',
            is_active = true;
    END IF;

    -- Ensure an authenticated owner can read their own profile so the app can
    -- resolve the role after login. This policy does not expose other profiles.
    IF NOT EXISTS (
      SELECT 1
        FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'profiles'
         AND policyname = 'Users can view own profile'
    ) THEN
      CREATE POLICY "Users can view own profile"
        ON public.profiles
        FOR SELECT
        TO public
        USING (auth.uid() = id);
    END IF;

    GRANT SELECT ON public.profiles TO authenticated;
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (owner_id, 'administrador'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    GRANT SELECT ON public.user_roles TO authenticated;
  END IF;
END
$$;
