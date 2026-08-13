# Plano para Área de Configurações Dinâmicas da Landing Page

Este plano descreve a criação de uma interface administrativa para gerenciar textos, CTAs e configurações visuais da landing page, removendo a necessidade de alterações manuais no código.

## Objetivo
Centralizar a gestão de conteúdo da loja pública em uma tabela de banco de dados (`company_settings`) e criar uma interface intuitiva no painel administrativo.

## Ações Técnicas

### 1. Banco de Dados
*   Expandir a tabela `public.company_settings` para incluir campos para todos os textos da landing page:
    *   `hero_title`: Título principal do Hero.
    *   `hero_subtitle`: Subtítulo do Hero.
    *   `hero_cta_primary`: Texto do botão principal.
    *   `hero_cta_secondary`: Texto do botão secundário.
    *   `bento_kicker`: Texto pequeno acima do título da seção "Mais Pedidos".
    *   `bento_title`: Título da seção de destaques.
    *   `bento_description`: Descrição da seção de destaques.
    *   `how_it_works_title`: Título da seção "Como Funciona".
    *   `contact_title`: Título da seção de contato.
    *   `contact_description`: Descrição da seção de contato.
*   Garantir permissões de `SELECT` para usuários `anon` e `authenticated`, e `UPDATE` para `service_role` (via admin).

### 2. Interface Administrativa (`src/routes/_authenticated/settings.tsx`)
*   Adicionar novas seções no formulário de configurações:
    *   **Hero**: Edição de título, subtítulo e textos dos botões.
    *   **Seções de Destaque**: Edição de títulos e kicker da seção Bento.
    *   **Fluxo e Contato**: Edição de textos das seções explicativas e de contato.
*   Implementar persistência desses novos campos no Supabase.

### 3. Integração com a Landing Page (`src/routes/index.tsx`)
*   Refatorar o componente `HomePage` e seus subcomponentes para utilizar os dados vindos do hook `useCompanyInfo`.
*   Substituir textos hardcoded por variáveis dinâmicas.
*   Componentes afetados: `Hero`, `FeaturedBento`, `HowItWorks`, `ContactSection`.

### 4. Hook de Dados (`src/hooks/useCompanyInfo.ts`)
*   Atualizar o hook para buscar todos os novos campos da tabela `company_settings`.
*   Garantir fallbacks (valores padrão) caso os campos no banco estejam nulos.
