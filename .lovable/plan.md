Vou fazer uma varredura de correções mobile focada em problemas reais, não uma reformulação visual. O objetivo é: nada corta na horizontal, todo botão é tocável, teclado abre sem cobrir campos, e a navegação funciona com uma mão.

Vou trabalhar em quatro frentes, testando cada uma em 375px (iPhone), 412px (Android) e 768px (tablet) via Playwright antes de fechar.

## 1. Global — bases que afetam tudo

- **Viewport meta**: adicionar `viewport-fit=cover` (respeita notch/safe-area do iPhone) mantendo `width=device-width, initial-scale=1`.
- **Safe area**: aplicar `env(safe-area-inset-*)` no header fixo, no FAB da Ella e no bottom-bar mobile do painel para não ficarem sob o notch ou sob a barra de gestos do iOS.
- **Tap targets**: garantir mínimo 44×44 em botões ícone (shadcn `size="icon"` hoje é 36px). Vou criar variante `size="icon-touch"` com `min-h-11 min-w-11` e aplicar nos locais críticos (header, FAB, close de modais, ações de linha).
- **Overflow horizontal**: já existe `overflow-x: hidden` em html/body. Vou revisar tabelas (pedidos, produção, PDV) para envolver em `overflow-x-auto` com wrapper, evitando estouro do viewport que hoje é mascarado pelo hidden.
- **Tipografia base**: manter `text-base` (16px) em inputs para o iOS não dar zoom no foco — já está no Input do shadcn. Vou confirmar em Textarea e Select.

## 2. Login / cadastro (/auth)

- Já adicionei autocomplete/inputMode/enterKeyHint no turno anterior.
- Vou vincular `Label` ↔ `Input` via `htmlFor`/`id` para tap na label focar o campo.
- Adicionar toggle "mostrar senha" (ícone olho) — reduz erro de digitação no teclado touch.
- Corrigir alturas: card com `p-6 sm:p-8` (hoje é `p-8` fixo, aperta demais no 320–360px).
- Logo com `h-32 sm:h-44` (hoje 176px come metade da tela pequena).
- Botão de submit com `min-h-12` para tap confortável.

## 3. Loja pública (/, /produtos, /produto/:slug, /carrinho)

- **Hero e CategoryCircles**: revisar overflow e tamanhos de fonte que hoje usam `clamp` — validar que não estouram em 360px.
- **ProductCard**: garantir `aspect-square` no wrapper da imagem, `line-clamp-2` no título, preço não quebra em duas linhas.
- **InfiniteProducts**: grade `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` (evita card único gigante no mobile).
- **StoreShell header**: sticky com safe-area-top; menu mobile em Sheet (shadcn) com trigger visível e tap 44px.
- **Carrinho**: botão "Finalizar" em barra fixa no bottom com `pb-[env(safe-area-inset-bottom)]` para não sumir atrás do teclado/gesture bar; quantidade com botões +/− de 44px.

## 4. Painel admin (auth-only)

- **AppShell sidebar**: no mobile virar Sheet (offcanvas), com trigger no header sempre visível. Se já é assim, garantir que fecha ao navegar.
- **EllaFab**: reposicionar acima do bottom-bar mobile com `bottom: calc(env(safe-area-inset-bottom) + 5.5rem)` no mobile e voltar ao normal em `md:`.
- **Tabelas** (orders, production, quotes, receivables, cash, clients): envolver cada `<table>` em `<div className="overflow-x-auto -mx-3 px-3">` para permitir scroll horizontal isolado. Colunas críticas com `whitespace-nowrap` em números/status.
- **Dashboard**: cards KPI em `grid-cols-2 lg:grid-cols-4` (hoje pode estar 1 coluna cheia no mobile).
- **PDV**: revisar `PdvCalculator` — teclado numérico com `inputMode="decimal"` já existe; garantir que o rodapé de pagamento não fica atrás do teclado virtual (usar `dvh` em vez de `vh` no container).
- **OrderEditor / BriefingCenter**: modais Sheet no mobile em vez de Dialog largo.

## Detalhes técnicos

Arquivos que vou alterar (previsão):

```
src/routes/__root.tsx           viewport-fit=cover
src/styles.css                  utility .safe-bottom / .safe-top, size-icon-touch
src/routes/auth.tsx             htmlFor, show-password, responsivo do card
src/components/AppShell.tsx     EllaFab safe-area, sidebar sheet mobile
src/components/EllaFab.tsx      posicionamento com safe-area
src/components/storefront/*     header sticky, ProductCard, Cart bar fixa
src/routes/_authenticated/*.tsx wrappers de tabela com overflow-x-auto
src/components/ui/button.tsx    variant icon-touch (44x44)
```

Não vou:
- Reescrever cores, fontes ou identidade visual (não foi pedido).
- Trocar libs de UI.
- Mexer em regras RLS, edge functions ou lógica de negócio.
- Alterar rotas ou fluxos existentes — só ajustes de layout, tap, safe-area e overflow.

Validação: rodar Playwright em 375×812, 412×915 e 768×1024, capturar screenshots de auth, /, /produtos, /carrinho, /dashboard, /pedidos e /pdv em cada tamanho, checar que nada corta e que os botões principais têm ≥44px.
