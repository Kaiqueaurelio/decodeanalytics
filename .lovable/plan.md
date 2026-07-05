# Plano de Melhorias — Alcateia's

## Diagnóstico resumido

**Loja pública**: O catálogo está bonito e funcional, mas o cliente não consegue comprar sozinho. Os botões "Adicionar ao carrinho", "Comprar agora" e "Enviar arte" estão todos desabilitados com a legenda "(em breve)". O único canal de conversão é o botão do WhatsApp. Isso significa que todo tráfego que chega ao site precisa de atendimento humano para fechar.

**Painel administrativo**: O PDV acumula 1.872 linhas e mistura venda rápida, cobrança de OS, fechamento de caixa, lançamentos de maquininha e cálculo por m² num único arquivo. A calculadora de serviços gráficos já existe como página separada (`/calculator`), mas não está acessível de dentro do PDV — exatamente o ponto onde o vendedor precisa dela. A tabela de OS não tem filtros por status ou data, e a produção não tem visual Kanban.

**SEO/Técnico**: Não existe `robots.txt` nem `sitemap.xml`. O manifest PWA está configurado, mas não há service worker ativo.

---

## Fase 1 — Quick Wins (entrega rápida, alto impacto)

### 1.1 Carrinho funcional na loja
- Criar `CartContext` com persistência em `localStorage`.
- Habilitar o botão "Adicionar ao carrinho" na página de produto.
- Adicionar ícone de carrinho no `StoreShell` com contador de itens.
- Página `/carrinho`: listar itens, alterar quantidade, remover, mostrar total.
- **Por que**: desbloqueia a primeira etapa de compra sem depender de WhatsApp.

### 1.2 Calculadora no PDV
- Integrar a `GraphicServiceCalculator` como um modal/drawer dentro da tela do PDV.
- Permitir que o vendedor, ao calcular um valor, clique em "Adicionar ao carrinho do PDV" e o item entre no carrinho com a descrição e valor calculados.
- **Por que**: resolve a dor imediata de vender serviços não cadastrados (que você mesmo pediu).

### 1.3 robots.txt + sitemap.xml
- Criar `public/robots.txt` permitindo tudo.
- Criar `public/sitemap.xml` com as rotas públicas (`/`, `/produtos`, `/produto/*`).
- **Por que**: Google não indexa direito sem esses arquivos.

### 1.4 Filtros na tabela de OS
- Adicionar filtros por status de produção, status de pagamento, prazo (hoje, atrasado, próximos 7 dias) e responsável.
- **Por que**: reduz o tempo de busca manual em listas longas.

---

## Fase 2 — Fechamento do ciclo de venda + operação

### 2.1 Checkout online (cliente finaliza sozinho)
- Página `/checkout`: dados do cliente, resumo do carrinho, escolha de retirada/entrega, observações.
- Ao finalizar: criar `client` (se novo), criar `order` + `order_items` no banco.
- Página `/pedido/:id` com resumo e status para o cliente acompanhar.
- Integrar upload de arte no checkout (usar bucket `arquivos` já existente).
- **Por que**: transforma o site em canal de venda real, não só vitrine.

### 2.2 WhatsApp com resumo automático
- No checkout, gerar link do WhatsApp com resumo do pedido já preenchido.
- Botão "Prefiro falar no WhatsApp" mantido como alternativa.
- **Por que**: quem quer atendimento humano continua tendo; quem quer autonomia, tem.

### 2.3 Kanban de produção
- Trocar a lista linear de `/production` por um board estilo Kanban com colunas por status (arte, impressão, acabamento, pronto, entregue).
- Drag-and-drop para mover cards entre colunas e atualizar o status da OS.
- **Por que**: visão imediata do gargalo da produção.

### 2.4 Relatórios de caixa e vendas
- No PDV (ou em nova rota `/reports`): exportar fechamento de caixa em PDF e vendas do dia/período.
- Gráfico simples de vendas por forma de pagamento.
- **Por que**: o fechamento já gera HTML para impressão, mas não há histórico consultável.

---

## Fase 3 — Automação e escala

### 3.1 Notificações inteligentes
- Alertas no dashboard para: OS atrasada, OS sem responsável há +24h, estoque baixo.
- Badge de notificação no header administrativo.
- **Por que**: evita que problemas só sejam descobertos na reunião de segunda.

### 3.2 Integração loja ↔ produção
- Pedidos feitos pelo site aparecem automaticamente como novas OS no painel.
- Status da OS reflete no acompanhamento do cliente (`/pedido/:id`).
- **Por que**: elimina digitação dupla e reduz erro humano.

### 3.3 Controle de estoque integrado
- Vincular `order_items` a itens de estoque.
- Baixa automática ao marcar OS como "pronto" ou "entregue".
- Alerta quando material está abaixo do mínimo.
- **Por que**: evita prometer prazo sem ter material.

---

## O que NÃO muda

- Todas as rotas `/_authenticated/*` permanecem intactas.
- Autenticação, RLS, tabelas e edge functions existentes não são alteradas.
- O `AppShell` administrativo continua igual.

---

## Sugestão de sequência

Se você quiser começar agora, recomendo a **Fase 1** inteira: são melhorias menores que já desbloqueiam valor imediato (carrinho, calculadora no PDV, filtros de OS, SEO básico). Aprovamos a Fase 1 para eu começar a implementar?