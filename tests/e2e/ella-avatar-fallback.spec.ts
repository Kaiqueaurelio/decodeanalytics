/**
 * E2E: fallback do avatar da Ella quando o carregamento da imagem falha.
 *
 * Simulamos a falha bloqueando (route.abort) todas as requisições ao asset
 * bundlado do avatar (`ella-avatar*.jpg`). O componente EllaAvatar tenta 3
 * vezes (retry) e depois exibe o fallback com as iniciais "ER" dentro de
 * um elemento com role="img" e aria-label contendo "Avatar de Ella".
 *
 * Run: bunx playwright test tests/e2e/ella-avatar-fallback.spec.ts
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:8080";
const AVATAR_URL_RE = /ella-avatar.*\.jpe?g(\?.*)?$/i;

// Aguarda o componente esgotar seus retries (3 tentativas * ~2s backoff * 1.5).
// Base 2000ms → ~ 2000 + 3000 + 4500 ≈ 9500ms. Damos folga.
const FALLBACK_TIMEOUT_MS = 30_000;

async function blockAvatar(page: import("@playwright/test").Page) {
  const attempts: string[] = [];
  await page.route(AVATAR_URL_RE, (route) => {
    attempts.push(route.request().url());
    return route.abort("failed");
  });
  return attempts;
}

async function expectFallbackVisible(page: import("@playwright/test").Page) {
  // O fallback é uma <div role="img"> com as iniciais; o <img> real também tem
  // role="img", por isso filtramos pelo texto para não casar com a imagem.
  const fallback = page.locator('div[role="img"][aria-label*="Avatar de Ella"]').first();
  await expect(fallback).toBeVisible({ timeout: FALLBACK_TIMEOUT_MS });
  await expect(fallback).toContainText("ER", { timeout: FALLBACK_TIMEOUT_MS });
}

test.describe("EllaAvatar fallback (falha de rede)", () => {
  test("/assistente exibe iniciais 'ER' após esgotar retries", async ({ page }) => {
    const attempts = await blockAvatar(page);

    await page.goto(`${BASE}/assistente`, { waitUntil: "domcontentloaded" });
    await expectFallbackVisible(page);

    // Deve ter tentado pelo menos 2 vezes (carga inicial + ao menos 1 retry).
    expect(attempts.length).toBeGreaterThanOrEqual(2);
  });

  test("/ella exibe fallback quando o avatar falha", async ({ page }) => {
    await blockAvatar(page);

    const resp = await page.goto(`${BASE}/ella`, { waitUntil: "domcontentloaded" });
    // Rota é autenticada — se redirecionou para /auth, o teste não pode validar.
    if (page.url().includes("/auth")) {
      test.skip(true, "/ella requer sessão autenticada; forneça auth E2E para validar aqui.");
      return;
    }
    expect(resp?.ok()).toBeTruthy();
    await expectFallbackVisible(page);
  });

  test("EllaFab (home) exibe fallback quando admin e imagem falha", async ({ page }) => {
    await blockAvatar(page);
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

    const fab = page.getByRole("link", { name: /Abrir Ella/i });
    if ((await fab.count()) === 0) {
      test.skip(true, "EllaFab só aparece para admins; forneça sessão de admin para validar.");
      return;
    }

    const fallback = fab
      .getByRole("img", { name: /Avatar de Ella/i })
      .first();
    await expect(fallback).toBeVisible({ timeout: FALLBACK_TIMEOUT_MS });
    await expect(fallback).toContainText("ER");
  });
});

test.describe("EllaAvatar sucesso (sem bloqueio)", () => {
  test("/assistente carrega a imagem real do avatar quando disponível", async ({ page }) => {
    await page.goto(`${BASE}/assistente`, { waitUntil: "domcontentloaded" });

    const img = page.locator('img[alt*="Avatar de Ella"]').first();
    await expect(img).toBeVisible();
    // naturalWidth > 0 confirma que a imagem carregou de verdade.
    await expect
      .poll(async () => await img.evaluate((el: HTMLImageElement) => el.naturalWidth), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
  });
});

test.describe("EllaFab — URL inválida do avatar", () => {
  test("responde 404 no avatar e mostra fallback 'ER' no FAB após retries", async ({ page }) => {
    // Cenário: a URL do avatar resolve para um recurso inexistente/inválido.
    // Diferente do abort de rede, aqui o servidor responde 404 — a imagem
    // dispara onError e o EllaAvatar deve, após esgotar as 3 tentativas,
    // renderizar o fallback com as iniciais "ER".
    const attempts: string[] = [];
    await page.route(AVATAR_URL_RE, async (route) => {
      attempts.push(route.request().url());
      await route.fulfill({
        status: 404,
        contentType: "text/plain",
        body: "Not Found",
      });
    });

    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

    const fab = page.getByRole("link", { name: /Abrir Ella/i });
    if ((await fab.count()) === 0) {
      test.skip(true, "EllaFab só aparece para admins; forneça sessão de admin para validar.");
      return;
    }

    const fallback = fab.getByRole("img", { name: /Avatar de Ella/i }).first();
    await expect(fallback).toBeVisible({ timeout: FALLBACK_TIMEOUT_MS });
    await expect(fallback).toContainText("ER");

    // Confirma que o retry ocorreu (mais de uma tentativa foi feita antes do fallback).
    expect(attempts.length).toBeGreaterThanOrEqual(2);
  });
});