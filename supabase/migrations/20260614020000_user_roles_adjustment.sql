-- Adicionar 'consumidor' ao enum app_role
ALTER TYPE public.app_role ADD VALUE 'consumidor';

-- Atualizar a função handle_new_user para colocar novos usuários como 'consumidor'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles(id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
    ON CONFLICT (id) DO NOTHING;
  
  SELECT NOT EXISTS(SELECT 1 FROM public.user_roles) INTO is_first;
  
  IF is_first OR LOWER(NEW.email) = 'alcateias@admin.br' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'administrador') ON CONFLICT DO NOTHING;
  ELSE
    -- Novos usuários agora entram como 'consumidor'
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'consumidor') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
