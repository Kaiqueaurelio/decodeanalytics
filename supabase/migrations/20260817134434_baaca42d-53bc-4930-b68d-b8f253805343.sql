GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Garantir que o usuário alcateias@admin.br tenha o papel de administrador no banco de dados
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'administrador'::app_role
FROM auth.users
WHERE email = 'alcateias@admin.br'
ON CONFLICT (user_id, role) DO NOTHING;