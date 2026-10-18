-- Serialize the first-user role bootstrap so concurrent registrations cannot
-- both observe an empty user_roles table and receive administrator privileges.
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

  IF is_first OR LOWER(NEW.email) = 'alcateias@admin.br' THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (NEW.id, 'administrador')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles(user_id, role)
    VALUES (NEW.id, 'atendente')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
