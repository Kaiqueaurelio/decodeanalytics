# Decode Analytics

Plataforma de gestão operacional e comercial da Decode Analytics, com autenticação, clientes, orçamentos, ordens de serviço, produção, estoque, caixa, contas a receber, catálogo de serviços, relatórios e configurações.

## Stack
- React + TypeScript
- TanStack Router e React Query
- Supabase Auth, PostgreSQL, Realtime e Storage
- Interface responsiva para desktop, tablet e celular

## Desenvolvimento local
1. Instale Node.js e npm.
2. Copie `.env.example` para `.env` e preencha as variáveis de ambiente do Supabase.
3. Execute `npm install`.
4. Execute `npm run dev`.

## Variáveis de ambiente
A aplicação usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Nunca versione arquivos `.env` nem credenciais privadas.

## Rebranding
A identidade visual, o catálogo público e os textos padrão foram atualizados para a Decode Analytics. A migração `20261018090000_decode_analytics_rebrand.sql` atualiza os dados padrão da empresa, desativa as ofertas antigas e cadastra serviços digitais iniciais. Os registros históricos de clientes, ordens, orçamentos e financeiro são preservados.
