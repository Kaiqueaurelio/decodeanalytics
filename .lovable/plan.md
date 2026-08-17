# Plan: Modernização e Refinamento do PDV para Tablets

Otimização da interface do Ponto de Venda (PDV) para dispositivos tablet, tornando-a mais intuitiva e eliminando a necessidade de modais para operações básicas (como a Venda Rápida), integrando essas funções diretamente na tela principal conforme sugerido pelo usuário.

## User Review Required

> [!IMPORTANT]
> A "Venda Rápida" será movida de um botão que abre um modal para um formulário sempre visível no topo ou na lateral da lista de produtos, facilitando o uso em tablets onde o espaço é maior.

## Technical Details

### Frontend Changes

- **Layout Tablet-First (`src/routes/_authenticated/pdv.tsx`)**
    - Ajustar a estrutura de grid para 2 colunas principais em tablets/desktops: Catálogo de Produtos (Esquerda) e Carrinho/Checkout (Direita).
    - Aumentar alvos de toque (touch targets) para botões de quantidade e categorias.
    - Otimizar o cabeçalho para exibir indicadores de caixa (Saldo, Vendas, Despesas) de forma mais compacta e elegante.

- **Integração de Venda Rápida e Calculadora**
    - Em vez de um botão que abre modal, a "Venda Rápida" terá um campo de "Descrição" e "Valor" fixo no topo da seção de produtos.
    - Ao preencher e apertar "Enter" ou "+" no teclado numérico, o item é adicionado instantaneamente ao carrinho.

- **Melhoria no Carrinho de Compras**
    - Transformar o carrinho em uma "Comanda" ou "Recibo" persistente com visual premium navy (#080c16).
    - Facilitar o ajuste de quantidades diretamente no item da lista sem precisar de cliques extras.

- **Estilização e Refinamento Visual**
    - Aplicar bordas arredondadas maiores (2xl/3xl) e sombras suaves para uma aparência "App Nativo".
    - Garantir que as imagens dos produtos ocupem o espaço de forma proporcional.

### Backend Changes

- Nenhuma alteração de esquema necessária; as mudanças são puramente de interface e fluxo de usuário (UX).

---

Este plano foca em transformar o PDV em uma ferramenta robusta para uso diário em balcão (tablets), reduzindo fricção e cliques desnecessários.
