# QA Mobile - Fluxo de Login (`/auth`)

Checklist para validar teclado nativo e layout em **iOS Safari**, **Android Chrome** e **WebViews** (in-app browsers: Instagram, Facebook, TikTok, WhatsApp).

## Ambiente

- iOS 16+ Safari (iPhone SE, 13, 15 Pro Max)
- Android 12+ Chrome (Pixel 5, Galaxy S22)
- WebView: Instagram / Facebook / TikTok in-app browser
- Orientações: retrato e paisagem
- Rede: 4G e Wi-Fi

## Passos de reprodução

| # | Passo | Critério de aceitação |
|---|-------|-----------------------|
| 1 | Abrir `/auth` | Layout renderiza sem scroll horizontal. Logo, tabs, inputs e botão visíveis. |
| 2 | Tocar no campo **E-mail** | Teclado nativo abre em ≤ 400ms. Tipo `email` (mostra `@` e `.com`). Input recebe foco visível (ring). |
| 3 | Digitar e-mail | Caracteres aparecem em tempo real. Sem zoom automático (font-size ≥ 16px). |
| 4 | Pressionar "Próximo/Next" no teclado | Foco move para campo **Senha**. |
| 5 | Tocar no campo **Senha** | Teclado abre. Input mascara caracteres. Botão olho (mostrar/ocultar) permanece clicável. |
| 6 | Tocar no botão **olho** | Alterna visibilidade da senha sem perder foco do input (ou reabrir teclado imediatamente ao retocar). |
| 7 | Botão **Entrar** com teclado aberto | Botão fica visível acima do teclado (scroll automático ou padding). Toque dispara submit. |
| 8 | Girar dispositivo para paisagem | Layout se ajusta. Sem overflow horizontal. Inputs continuam clicáveis. |
| 9 | Alternar tab **Criar conta** | Campos Nome / E-mail / Senha respondem ao toque com teclado nativo. `autoCapitalize=words` no Nome. |
| 10 | Fechar teclado (tap fora) | Layout retorna ao estado inicial sem quebras visuais. |
| 11 | WebView Instagram/Facebook | Mesmos critérios de 1-7. Se falhar, oferecer "Abrir no navegador". |
| 12 | VoiceOver / TalkBack | Labels anunciados: "E-mail, campo de texto", "Senha, campo seguro". |

## Critérios gerais

- **Zero overflow horizontal** em qualquer viewport 320px+.
- Todos os campos `min-height: 48px` (alvo de toque WCAG).
- `font-size` dos inputs = 16px (evita zoom iOS).
- Foco visível (outline/ring) com contraste ≥ 3:1.
- Botão principal sempre alcançável (não coberto pelo teclado).

## Telemetria

A tela `/auth` emite eventos via `window.dispatchEvent(new CustomEvent('auth-telemetry', { detail }))` e `console.info('[auth-telemetry]', detail)`. Eventos coletados:

- `auth_page_view` – ao montar.
- `auth_input_focus` – ao focar cada input (`inputId`, `platform`, `viewport`).
- `auth_input_focus_failed` – tap detectado sem `focus` em 500ms.
- `auth_keyboard_suspected_hidden` – `visualViewport.height` sem redução após foco em 800ms (heurística).
- `auth_submit_attempt` / `auth_submit_error`.

Para plugar em Sentry/GA basta escutar o evento:

```js
window.addEventListener('auth-telemetry', (e) => analytics.track(e.detail.event, e.detail));
```

## Testes E2E

Playwright em `tests/e2e/auth-mobile.spec.ts` — roda em viewport iPhone 13 e Pixel 5, valida abertura de teclado (heurística de foco + digitação) e ausência de overflow horizontal.

```
bunx playwright test tests/e2e/auth-mobile.spec.ts
```