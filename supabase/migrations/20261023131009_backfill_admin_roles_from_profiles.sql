-- Keep role-based navigation and RLS helpers synchronized with the canonical profile role.
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
