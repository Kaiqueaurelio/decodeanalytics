# Primeiro administrador

Novos cadastros recebem apenas o papel `aguardando_aprovacao`. Para a primeira instalação, crie a conta do responsável pela tela de cadastro, confirme o e-mail e execute o SQL abaixo no SQL Editor do Supabase, substituindo o endereço pelo e-mail verificado do responsável.

```sql
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id
    INTO target_user_id
    FROM auth.users
   WHERE lower(email) = lower('owner@example.com');

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Não existe usuário confirmado para o e-mail informado';
  END IF;

  DELETE FROM public.user_roles
   WHERE user_id = target_user_id
     AND role = 'aguardando_aprovacao';

  INSERT INTO public.user_roles(user_id, role)
  VALUES (target_user_id, 'administrador')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
```

Depois desse passo, administradores podem liberar cadastros pendentes na área **Usuários e permissões**. Não habilite administração automática para a primeira pessoa que se cadastrar.
