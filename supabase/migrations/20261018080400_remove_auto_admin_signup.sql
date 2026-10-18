-- Never grant administrator privileges based on signup order or a hard-coded
-- email address. Bootstrap the first administrator with a deliberate SQL action.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, 'aguardando_aprovacao')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
