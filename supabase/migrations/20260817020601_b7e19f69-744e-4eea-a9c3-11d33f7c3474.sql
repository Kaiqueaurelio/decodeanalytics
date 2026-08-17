-- Criando usuários de teste para validação de papéis
-- O trigger handle_new_user gerencia a criação automática de perfis e atribuição de papéis (default: atendente)

-- 1. Inserir usuários no Auth (sem colunas geradas)
INSERT INTO auth.users (id, email, raw_user_meta_data) 
VALUES (gen_random_uuid(), 'qa_atendente@alcateia.br', '{"full_name": "QA Atendente"}');

INSERT INTO auth.users (id, email, raw_user_meta_data) 
VALUES (gen_random_uuid(), 'qa_producao@alcateia.br', '{"full_name": "QA Producao"}');

-- 2. Atualizar o papel do usuário de produção (o trigger o criará como atendente)
-- Usamos uma subquery segura para encontrar o ID
DO $$
BEGIN
  UPDATE public.user_roles 
  SET role = 'producao' 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'qa_producao@alcateia.br');
END $$;
