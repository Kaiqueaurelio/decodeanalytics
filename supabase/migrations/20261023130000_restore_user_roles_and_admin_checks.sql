-- Restore the role table and permission helpers expected by the Decode Analytics app.
-- The first administrator is assigned separately to the verified owner account; never
-- grant administrator access automatically to whoever signs up first.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
       AND t.typname = 'app_role'
  ) THEN
    CREATE TYPE public.app_role AS ENUM (
      'administrador',
      'atendente',
      'producao',
      'financeiro',
      'aguardando_aprovacao'
    );
  END IF;
END
$$;

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aguardando_aprovacao';

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- Seed the role table from the existing, authoritative profile role. The app
-- checks user_roles through RLS and existing policies call has_role(). Without
-- this backfill, existing administrators would lose access after this migration.
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role::public.app_role
  FROM public.profiles AS p
 WHERE p.role = 'administrador'
   AND p.is_active IS DISTINCT FROM false
   AND NOT EXISTS (
     SELECT 1
       FROM public.user_roles AS ur
      WHERE ur.user_id = p.id
        AND ur.role = p.role::public.app_role
   );

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.user_roles
     WHERE user_id = _user_id
       AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('administrador'::public.app_role, _user_id);
$$;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

GRANT SELECT ON public.user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
