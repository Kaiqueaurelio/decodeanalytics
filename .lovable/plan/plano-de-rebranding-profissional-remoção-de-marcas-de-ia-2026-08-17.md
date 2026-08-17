# Plano de Rebranding Profissional (Remoção de marcas de IA)

O objetivo é remover todos os elementos visuais e textuais que remetam ao uso de inteligência artificial ou ao nome "Ella Ribeiro", substituindo-os por uma linguagem corporativa e profissional de produção gráfica.

## Alterações Visuais e de UI

- **Remoção de Ícones "Sparkles" (Brilhos)**: Frequentemente associados a recursos de IA. Substituiremos por ícones que remetam a qualidade técnica ou produção (como `CheckCircle`, `Zap`, `Settings`).
- **Substituição do Ícone "Bot"**: Remover o ícone de robô e substituí-lo por ícones de suporte ou especialistas.
- **Simplificação de Fundos**: Remover efeitos de gradiente "mágicos" ou padrões de "rede neural" que possam sugerir IA.
- **Remoção Global do EllaFab**: Garantir que o botão flutuante da assistente Ella seja removido de todas as views (já iniciado em turnos anteriores, mas reforçaremos no `AppShell.tsx` e `StoreShell.tsx`).

## Alterações de Texto e Branding

- **Rebranding do Assistente**: Mudar "Assistente IA" para "Central de Gestão" ou "Consultor Alcateia".
- **Ajuste de Prompts e Sugestões**: Alterar textos que mencionam " IA analisando seus arquivos" para "Sistema de validação técnica".
- **Remoção de Termos Técnicos Expostos**: Remover menções a "Banco com RLS", "Infra global", "Login criptografado" da landing page, que dão um ar de template de tecnologia/SaaS.

## Detalhes Técnicos

- **`src/routes/index.tsx`**:
    - Remover `TechSecuritySection` (muito parecida com landing page de tech).
    - Mudar ícones `Sparkles` nas seções de categorias e "Como Funciona".
    - Atualizar textos de `ArtTipsSection` para focar 100% em produção física.
- **`src/components/AppShell.tsx`**:
    - Renomear links de "/ella" para "/gestao-inteligente" ou similar.
    - Mudar ícone `Sparkles` no menu lateral para `LayoutDashboard` ou `Activity`.
- **`src/routes/_authenticated/ella.tsx`**:
    - Renomear a página para "Gestor Alcateia".
    - Mudar o ícone `Bot` por um ícone corporativo.
- **`src/components/storefront/Hero.tsx`**:
    - Remover o ícone `Sparkles` do badge superior.
