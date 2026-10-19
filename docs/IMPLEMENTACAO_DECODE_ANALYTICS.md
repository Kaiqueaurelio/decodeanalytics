# Plano de implementação — Decode Analytics

## Princípios obrigatórios
- Preservar os dados existentes; não apagar nem recriar tabelas sem backup e revisão.
- Fazer mudanças de banco de dados em migrations versionadas e reversíveis sempre que possível.
- Nunca adicionar tokens, senhas, chaves privadas ou a chave `service_role` ao frontend ou ao repositório.
- Validar permissões no Supabase (RLS/policies) antes de publicar fluxos administrativos.
- Usar dados de teste e validar o build antes de liberar produção.

## Etapa 0 — Segurança e estabilidade (bloqueia publicação)
- [ ] Confirmar backup/exportação recuperável do banco e dos arquivos do Storage.
- [ ] Inventariar tabelas, funções, triggers, buckets, policies RLS e permissões atuais.
- [ ] Verificar autenticação e autorização no servidor/banco para rotas e operações administrativas.
- [ ] Validar políticas de leitura pública apenas para dados que realmente devem ser públicos.
- [ ] Revisar secrets, variáveis de ambiente, logs e dependências vulneráveis.
- [ ] Adicionar validações de entrada e mensagens de erro que não exponham dados sensíveis.
- [ ] Executar build, lint e testes; corrigir erros antes de publicar.

## Etapa 1 — Catálogo e orçamentos
- [x] Exibir a marca Decode Analytics nos cards do catálogo.
- [x] Não substituir fotos reais por imagens geradas; sem foto cadastrada, usar placeholder.
- [x] Tela de orçamentos com busca, filtro de status, itens/quantidades e atalho de WhatsApp.
- [x] Permitir categoria digitada no cadastro do produto.
- [x] Validar campos essenciais, preço, URL de imagem e tamanho/tipo de arquivo antes de salvar.
- [ ] Receber os prints reais do catálogo e associar as imagens aos produtos corretos.
- [ ] Verificar o ciclo completo de criar/editar produto, upload, cotação e atualização do status.

## Etapa 2 — Fluxo comercial
- [ ] Validar carrinho de orçamento, totais e quantidades no cliente e no servidor.
- [ ] Revisar geração de PDF e consistência de valores/identificação do cliente.
- [ ] Validar etapas do funil de vendas e transições de status.
- [ ] Validar calculadora de preços com regras comerciais configuradas.
- [ ] Implementar lembretes com consentimento, controle de duplicidade e opção de desativar.

## Etapa 3 — Inteligência e gestão
- [ ] Assistente de IA com limites, tratamento de erros e proteção de dados de clientes.
- [ ] Automatizações idempotentes, auditáveis e com possibilidade de reprocessamento seguro.
- [ ] Analytics com métricas definidas e sem exposição indevida de dados pessoais.
- [ ] Previsão de vendas identificada como estimativa e baseada em dados suficientes.
- [ ] Relatórios com filtros, validação de totais e exportação testada.

## Etapa 4 — PWA e publicação
- [ ] Conferir manifest, ícones 192/512, favicon, service worker e estratégia de cache.
- [ ] Testar instalação em iOS e Android; validar atualização e funcionamento offline esperado.
- [ ] Testar em ambiente de preview com dados não produtivos.
- [ ] Confirmar deploy verde, URL correta e smoke tests em produção.
- [ ] Manter plano de rollback e confirmar que os dados existentes permanecem intactos.

## Critérios para considerar pronto
1. Build e lint aprovados; testes críticos documentados.
2. RLS e permissões revisadas com evidências, sem segredos expostos.
3. Fluxos de catálogo, orçamento e WhatsApp testados com casos válidos e inválidos.
4. Backup restaurável e rollback definido.
5. Deploy confirmado e verificado na URL de produção.

> Estado: os itens marcados como concluídos refletem alterações feitas no código do repositório, mas ainda precisam passar por build e validação de ponta a ponta. As imagens reais dos produtos ainda dependem do envio dos arquivos do catálogo.
