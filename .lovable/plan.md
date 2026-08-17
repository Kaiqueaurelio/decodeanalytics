# Plano de Implementação: Vinculação de Categorias e Catálogo

O objetivo é vincular as categorias nos menus (público e lateral) ao catálogo de produtos correspondente e adicionar botões "Ver catálogo" nas seções de categorias da landing page.

## Alterações

### Componentes

1.  **src/components/storefront/StoreShell.tsx**:
    *   No menu lateral móvel (`SheetContent`), garantir que cada item de categoria leve à página `/produtos` com a categoria selecionada.
    *   No menu de categorias desktop (`CategoryNav`), garantir que os links estejam funcionando corretamente (já parecem estar, mas irei validar).

2.  **src/components/storefront/CategoryCircles.tsx**:
    *   Garantir que os círculos de categoria no topo da landing page redirecionem corretamente para `/produtos?cat=Slug`.

3.  **src/routes/index.tsx**:
    *   Na seção `CategoriesSection`, substituir a estrutura atual de links por um botão explícito "Ver catálogo" em cada card de categoria.
    *   Refinar o design dos cards de categoria para acomodar o botão de forma elegante.

### Detalhes Técnicos

*   Uso do componente `Link` do `@tanstack/react-router` com a prop `search={{ cat: c.slug }}`.
*   Padronização visual dos botões seguindo o design system do projeto (Tailwind v4 tokens).
*   Garantia de touch targets adequados (mínimo 44px) para dispositivos móveis.
