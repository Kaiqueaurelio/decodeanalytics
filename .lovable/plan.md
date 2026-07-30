## Objetivo

Eliminar de vez a tela "This page didn't load" (falha de hidratação), endurecer o login/cadastro em `/auth` e garantir acessibilidade real no fluxo de entrada — sem criar estrutura nova nem mexer no que já funciona.

## Passo 1 — Estabilizar a hidratação (causa do erro)

- `src/routes/_authenticated/route.tsx`: manter o fallback estável já existente, mas garantir que ele renderize exatamente o mesmo HTML no servidor e no navegador (sem `Math.random`, sem data/hora, sem leitura de `localStorage` no primeiro render). O redirecionamento continua só dentro de `useEffect`.
- `src/routes/__root.tsx`: revisar o `errorComponent` para não disparar em erro de hidratação recuperável — só em erro real de rota. Remover qualquer `suppressHydrationWarning` que esteja mascarando o problema em vez de resolver.
- `src/lib/theme.tsx` e `src/lib/cart-context.tsx`: conferir se leem `localStorage` durante o render inicial; se lerem, mover a leitura para `useEffect` com estado inicial fixo. Essa é a fonte mais comum de mismatch em toda a árvore, inclusive no painel.

## Passo 2 — Endurecer `/auth`

- `<form method="post">` nos dois formulários (login e cadastro), mantendo `preventDefault`.
- Validação antes de chamar o backend:
  - e-mail: obrigatório, formato válido, máx. 255
  - senha: obrigatória, mín. 8
  - cadastro: nome com `trim()` e máx. 100 + campo **confirmar senha** que precisa bater
- `try/catch` em `signInWithPassword`, `signUp` e `resetPasswordForEmail`.
- Mensagens de erro traduzidas e neutras reutilizando `mapApiError` de `src/lib/api-errors.ts` (credencial inválida, rede caindo, e-mail já usado, sem permissão). Nada de repassar o texto cru do provedor.
- Os 4 estados visíveis: pronto, carregando (botão desabilitado + texto), erro (toast) e sucesso (toast + navegação).

## Passo 3 — Acessibilidade do fluxo de login

- Erro de validação exibido também em texto abaixo do campo, com `aria-invalid` e `aria-describedby` — não só via toast e não só por cor.
- `role="alert"` na mensagem de erro do campo.
- Botões de mostrar/ocultar senha: já são `<button>` com `aria-label`; adicionar `focus-visible:ring-2` visível.
- Conferir contraste AA do texto secundário e das abas Entrar/Criar conta sobre o card.
- Navegação por teclado: Tab percorre abas → campos → mostrar senha → enviar → esqueci a senha, com foco sempre visível.
- Confirmar que `prefers-reduced-motion` já desliga transições (regra existe em `src/styles.css`) e que o spinner do fallback respeita isso.

## Passo 4 — Validação

- Rodar os testes E2E existentes (`tests/e2e/`) para não quebrar nada.
- Playwright em 375px: abrir `/auth`, tentar login vazio, login inválido, cadastro com senhas diferentes; abrir `/dashboard` deslogado e confirmar que vai para `/auth` sem a tela de erro.

## Fora de escopo (não faço agora)

- Mudar regras de papéis/admin no banco ou a checagem de admin da Ella — é outro assunto, com risco de quebrar acesso atual. Aviso se quiser em seguida.
- Redesenho visual, troca de libs ou nova rota de reset de senha.

## Arquivos previstos

```
src/routes/auth.tsx
src/routes/_authenticated/route.tsx
src/routes/__root.tsx
src/lib/theme.tsx        (só se ler storage no render)
src/lib/cart-context.tsx (só se ler storage no render)
```