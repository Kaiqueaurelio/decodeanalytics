# Validação e Mitigação de Erros no App

Este plano foca na estabilidade do aplicativo, resolvendo erros de hidratação detectados e garantindo que as melhorias solicitadas (como a remoção do nome "Ella Ribeiro" e ocultação de preços) estejam aplicadas de forma consistente e segura.

## Alterações Técnicas

### 1. Correção de Erros de Hidratação
- **src/routes/auth.tsx**: O erro de hidratação ocorre devido a uma divergência entre a estrutura de Suspense renderizada no servidor vs cliente. Vou simplificar a estrutura de renderização para garantir paridade.
- **src/routes/__root.tsx**: Reforçar as diretivas `suppressHydrationWarning` onde scripts de tema ou analytics injetam atributos dinâmicos.

### 2. Consistência Visual e Identidade
- **src/routes/index.tsx**: Remover as referências textuais do usuário (input de teste) que aparecem na `body` (como detectado no log de seleção).
- **Busca Global**: Garantir que o nome "Ella Ribeiro" não persista em arquivos de ajuda, placeholders ou logs de sistema remanescentes.

### 3. Melhoria na Estabilidade Mobile
- **src/styles.css**: Hardening das regras de overflow para garantir que nenhum elemento "vaze" para fora da tela em dispositivos de 320px-375px.
- **src/lib/auth-telemetry.ts**: Ajustar os logs para serem menos ruidosos em produção, focando apenas em falhas críticas de foco.

## User Review Required

> [!IMPORTANT]
> A remoção completa do nome "Ella Ribeiro" afeta a personalidade do chat de IA. Ele passará a ser identificado apenas como "Assistente IA" ou "Alcateia IA". O avatar será substituído por um ícone genérico de robô/faísca para evitar imagens quebradas em ambientes como a Vercel.

## Technical Details
- **Framework**: TanStack Start v1 (React 19)
- **Runtime**: Cloudflare Workers / nodejs_compat
- **Estilos**: Tailwind CSS v4
- **Database/Auth**: Supabase (via Lovable Cloud)
