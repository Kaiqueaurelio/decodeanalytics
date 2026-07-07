## Objetivo
Deixar o PDV utilizável em dispositivos móveis reais (largura ~360–430px) sem depender de zoom out do navegador. Hoje os botões da toolbar, cards de produtos e sidebar são grandes demais nesse tamanho.

## Alterações em `src/routes/_authenticated/pdv.tsx`

### 1. Toolbar (busca + 7 botões de ação)
- Busca: reduzir altura mobile (`h-11`) e padding do ícone (`h-4 w-4` mobile → `h-5 w-5` em `sm`); manter altura maior em `sm+`.
- Grid dos botões: passar de `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7` para `grid-cols-3 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-7` para caber melhor 6–7 itens compactos.
- Botões: reduzir mobile de `h-11 text-xs` para `h-10 text-[10px]` com `gap-1`, `px-1.5`, ícones `h-3.5 w-3.5` no mobile (mantendo `sm:h-14 sm:text-sm` e `sm:h-5 sm:w-5` em telas maiores).
- Encurtar rótulos no mobile via `<span className="hidden sm:inline">` quando necessário (ex.: "Venda Rápida" → "Venda", "Calculadora" → "Calc", "Cobrar OS" → "OS", "Produtos" → "Prod.") para evitar quebra e sobreposição.

### 2. Categorias (chips horizontais)
- Reduzir padding mobile (`px-3 py-2 text-xs` no mobile, `sm:px-4 sm:py-3 sm:text-sm`) para chips menores.

### 3. Grid de produtos
- Ajustar para `grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` (já é 2 colunas no mobile). Reduzir padding interno dos cards e tamanhos de tipografia no mobile (títulos `text-sm`, preço `text-base`) para caber bem em telas de ~360px.

### 4. Sidebar (carrinho/checkout)
- Já vira coluna abaixo em `<lg`. Reduzir paddings e tamanhos de fonte no mobile do resumo/checkout para não empurrar layout.

### 5. Cards de resumo/lançamentos no topo
- Verificar que ícones grandes e badges não estouram em mobile; reduzir `text-xl` do valor para `text-lg` no mobile e `h-3 w-3` nos ícones de ação onde aplicável.

## Verificação
- Testar via Playwright em viewport 375×812 (iPhone), 414×896 e 768×1024:
  - Sem overflow horizontal (`document.documentElement.scrollWidth <= clientWidth`).
  - Todos os 7 botões da toolbar visíveis sem sobreposição.
  - Cards de produto legíveis, botão "Adicionar" acessível.
  - Screenshots de confirmação em cada viewport.

## Arquivo alterado
- `src/routes/_authenticated/pdv.tsx`
