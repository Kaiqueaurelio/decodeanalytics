# Rebranding para Decode Analytics

## Escopo
- Identidade pública e textos padrão atualizados para dados, tecnologia, automação e soluções digitais.
- Removidos os assets locais de produtos gráficos e as marcas antigas da pasta pública.
- Catálogo anterior desativado; sete serviços iniciais da Decode são cadastrados com preço zero para que a equipe defina valores reais no painel.
- Autenticação, clientes, orçamentos, ordens de serviço, produção, estoque, caixa, contas a receber e relatórios permanecem no código.

## Dados e segurança
- O arquivo `.env` versionado foi removido e o ignore foi reforçado. Se algum valor real foi exposto, revise/rotacione credenciais e remova o histórico sensível conforme necessário.
- A migração não apaga clientes, ordens, orçamentos, pagamentos nem contas a receber. Ofertas antigas ficam inativas para preservar referências históricas.
- O telefone e e-mail da Decode usados como padrões são os dados de contato fornecidos pelo proprietário. Endereço e documento fiscal ficam vazios até confirmação.

## Antes do deploy
- Aplicar a migração no projeto Supabase correto.
- Configurar variáveis de ambiente no provedor de deploy.
- Executar lint, testes e build; conferir a landing page e o painel com os serviços recém-cadastrados.
- Conferir domínio, favicon e metadados no ambiente publicado.
