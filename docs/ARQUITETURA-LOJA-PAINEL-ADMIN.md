# Arquitetura da loja e do painel administrativo — Decode Analytics

## Objetivo

Construir uma experiência híbrida: organização e clareza de um e-commerce profissional, com identidade tecnológica própria da Decode Analytics. A prioridade é corrigir e validar o sistema existente antes de expandir funcionalidades. Este documento define o plano; não declara que testes, migrações ou publicações foram concluídos.

## Princípios não negociáveis

- Preservar os fluxos e os dados existentes até confirmar o esquema real e criar um plano de migração reversível.
- Não inventar preços nem substituir dados de produtos sem validação do responsável.
- Não tratar a interface como mecanismo de segurança: autorizações devem ser validadas no servidor/banco.
- Nunca expor service-role keys, tokens ou segredos em código cliente ou histórico público.
- Separar alterações em commits pequenos; validar build e testes antes de mesclar e publicar.
- Medir sucesso por fluxos testados e evidências registradas, não apenas pela aparência.

## Arquitetura visual da loja

### 1. Cabeçalho global
- Logo Decode Analytics e navegação acessível.
- Busca de produtos/serviços, categorias, conta e carrinho.
- Menu mobile com foco visível, alvos de toque adequados e navegação por teclado.
- Cabeçalho compacto durante rolagem, sem esconder ações essenciais.

### 2. Página inicial
1. Hero com proposta de valor clara e CTA principal.
2. Categorias principais: Desenvolvimento Digital, Suporte Técnico, Software e Licenças, Produtos Digitais, Templates Digitais, Design e Marketing.
3. Produtos/serviços em destaque, com preços apenas quando confirmados.
4. Como funciona: escolha, solicitação/orçamento, confirmação e entrega.
5. Provas de confiança e FAQ somente com informações verificadas.
6. Contato e rodapé com links reais para políticas, privacidade e atendimento.

### 3. Catálogo e resultados
- Pesquisa, filtros por categoria e ordenação estável.
- Cards consistentes com imagem, título, preço/“solicitar orçamento”, disponibilidade e CTA.
- Estados de carregamento, sem resultados, erro e tentativa novamente.
- Não usar avaliação, estoque ou desconto fictícios.
- Não exibir produtos desativados nem confundir templates digitais com serviços.

### 4. Detalhe do produto/serviço
- Descrição, entregáveis, requisitos, prazo quando conhecido, preço validado e perguntas frequentes.
- Variantes e quantidades somente quando suportadas pelos dados reais.
- CTA contextual: adicionar ao carrinho para itens compráveis ou solicitar orçamento para serviços variáveis.
- Produtos relacionados sem duplicação e com rota funcional.

### 5. Carrinho e conversão
- Alterar/remover itens, validar quantidade e mostrar subtotal de forma consistente.
- Revalidar preços e disponibilidade no servidor antes de confirmar qualquer pedido.
- WhatsApp deve gerar mensagem a partir dos dados atuais e apresentar fallback acessível.
- Não apresentar pagamento como concluído sem confirmação do provedor.

### 6. Páginas institucionais
- Contato, política de privacidade, trocas/reembolsos e termos aplicáveis.
- Publicar apenas políticas revisadas e compatíveis com a operação real.
- Eliminar links inertes (por exemplo, links vazios com `#`) ou substituí-los por destinos confirmados.

## Arquitetura funcional do painel administrativo

### Navegação
- Visão geral
- Catálogo
- Categorias
- Pedidos e orçamentos
- Clientes
- Mídia/arquivos
- Conteúdo da página inicial
- Relatórios
- Usuários e permissões
- Configurações e auditoria

### Visão geral
Mostrar somente métricas derivadas de dados reais: pedidos por estado, valor confirmado, orçamentos pendentes e itens mais vistos (se analytics estiver configurado). Estados vazios devem explicar como começar; não semear números fictícios.

### Catálogo
- Criar/editar/desativar produto, categoria, descrição, slug, preço, tipo de oferta e imagens.
- Validar campos no cliente e no servidor.
- Prevenir slug duplicado e confirmar antes de ações destrutivas.
- Guardar autoria e horário de alterações relevantes.
- Não apagar fisicamente produtos referenciados por pedidos; preferir desativação/arquivamento.

### Pedidos e orçamentos
- Estados explícitos e transições permitidas.
- Histórico de alterações, notas internas e timestamps.
- Recalcular valores em fonte confiável; não confiar em total enviado pelo navegador.
- Não registrar pagamento como aprovado sem confirmação verificável.

### Clientes e usuários
- Separar conta de cliente de função administrativa.
- Privilégios definidos por fonte confiável no banco/servidor, nunca por metadados editáveis pelo próprio usuário.
- Impedir autoelevação de privilégio no cadastro público.
- Operações administrativas exigem autorização explícita e trilha de auditoria.

### Configurações
- Dados públicos de contato, logo, conteúdo e preferências editáveis com validação.
- Segredos e credenciais ficam em variáveis de ambiente/servidor, nunca em configurações públicas do navegador.
- Alterações de políticas legais precisam de revisão antes de publicação.

## Requisitos técnicos e segurança

- Supabase Auth e RLS devem cobrir todas as tabelas acessíveis pela API pública.
- Testar acesso anônimo, cliente autenticado, administrador e usuário de outra empresa (se multiempresa for introduzido).
- Se o produto evoluir para multiempresa, incluir tenant_id e políticas de isolamento antes de aceitar empresas externas; não presumir que o isolamento já existe.
- Validar variáveis de ambiente, ignorar arquivos locais e revisar histórico do Git para possíveis segredos expostos.
- Service worker pode armazenar recursos estáticos públicos; nunca armazenar respostas autenticadas, dados pessoais, pedidos ou respostas de API sensíveis no cache offline.
- Acessibilidade: labels, foco visível, contraste, mensagens de erro claras, teclado e leitores de tela.
- SEO básico: título e descrição por página, URLs canônicas quando aplicável, metadados sociais e imagens adequadas.

## Plano de execução com critérios de aceite

### Fase 0 — Estabelecer linha de base (primeiro trabalho)
1. Confirmar o projeto Supabase correto e seu estado.
2. Identificar tabelas, políticas RLS, funções/triggers e dados de produção sem modificá-los.
3. Confirmar quais variáveis de ambiente são usadas em preview e produção, sem revelar valores secretos.
4. Registrar comandos disponíveis para lint, testes e build.
5. Registrar o estado do PR e do deploy.

**Aceite:** projeto e esquema corretos identificados; nenhum dado alterado; riscos e comandos de teste documentados.

### Fase 1 — Segurança e integridade
- Corrigir credenciais expostas caso existam e rotacionar segredos quando necessário.
- Revisar autorização de admin e RLS.
- Revisar migração de rebranding para idempotência, preservação de históricos e ausência de duplicações.
- Criar plano de backup/rollback.

**Aceite:** matriz de permissões testada; migração revisada em ambiente seguro; rollback documentado.

### Fase 2 — Testes e estabilidade
- Instalar dependências de forma reprodutível.
- Executar lint, testes unitários, testes de rotas e build.
- Adicionar testes para login, recuperação, catálogo, carrinho, autorização e operações administrativas.
- Registrar falhas e corrigir antes de avançar.

**Aceite:** pipeline passa; fluxos críticos têm testes automatizados e evidência de execução.

### Fase 3 — Validação da loja
- Conferir os 42 itens do catálogo com uma fonte de verdade aprovada.
- Validar imagens, categorias, preços e estado ativo/inativo.
- Testar busca, filtros, detalhe, carrinho e WhatsApp em tamanhos de tela diferentes.

**Aceite:** nenhum preço/imagem inventado; links e CTAs verificados; fluxos críticos passam.

### Fase 4 — Painel administrativo
- Auditar o painel atual antes de reconstruir componentes.
- Priorizar gestão segura de produtos/categorias e depois pedidos/orçamentos, conteúdo, relatórios e permissões.
- Criar confirmações, estados de erro/sucesso e auditoria.

**Aceite:** alterações persistem no banco correto, são autorizadas no servidor e têm testes de regressão.

### Fase 5 — Homologação e produção
- Deploy de preview; revisão visual e funcional em desktop/mobile.
- Testar PWA e atualização do service worker.
- Aprovação explícita antes de mesclar/publicar.
- Verificação pós-deploy de rotas, logs e operações essenciais.

**Aceite:** checklist assinado, deploy READY e smoke tests executados no domínio de produção.

## Bloqueios atuais a resolver

- O projeto Supabase chamado `saas decode analytics` apareceu como `INACTIVE` na consulta mais recente. Confirmar/reativar o projeto correto antes de acessar ou migrar dados.
- A PR de rebranding permanece aberta; confirmar o estado e a estratégia de integração antes de produção.
- A autenticação e a regra de primeiro usuário administrador precisam ser revisadas no código e nas políticas do banco antes de confiar nelas.
- O estado do deploy e os testes end-to-end precisam de confirmação por evidência; não presumir que a build ou a publicação terminou.

## Checklist da primeira tarefa

- [ ] Confirmar o projeto Supabase correto.
- [ ] Obter esquema/tabelas e políticas RLS sem mutações.
- [ ] Verificar se o login usa o mesmo projeto/ref.
- [ ] Inspecionar regra de privilégios administrativos.
- [ ] Confirmar scripts npm de lint/test/build.
- [ ] Registrar resultados e só então preparar correções pequenas.
