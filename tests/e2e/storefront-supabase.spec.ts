import { test, expect } from "@playwright/test";

// Fluxo ponta a ponta: front -> Supabase (catálogo público via RLS anon).
// Mesmo teste roda local e contra a Vercel (TEST_URL=...), garantindo paridade.

test("landing carrega catálogo real do backend (estado de sucesso)", async ({ page }) => {
  const calls: number[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/rest/v1/services")) calls.push(r.status());
  });

  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();

  await expect
    .poll(() => calls.length, { timeout: 20_000 })
    .toBeGreaterThan(0);
  expect(calls.every((s) => s === 200 || s === 206)).toBeTruthy();
});

test("estado de erro: rede caindo mostra mensagem clara, sem tela branca", async ({ page }) => {
  await page.route("**/rest/v1/services*", (route) => route.abort("failed"));
  await page.goto("/");
  // A página continua utilizável e o erro é comunicado (toast ou bloco de erro).
  await expect(page.locator("h1").first()).toBeVisible();
  // A grade de produtos fica abaixo da dobra e só monta ao entrar em viewport.
  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(1000);
  await expect(
    page.getByText(/não foi possível|tentar novamente|conexão/i).first(),
  ).toBeVisible({ timeout: 20_000 });
});

test("estado vazio: catálogo sem itens não quebra a landing", async ({ page }) => {
  await page.route("**/rest/v1/services*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.mouse.wheel(0, 4000);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("sem permissão (RLS) em rota privada redireciona para /auth", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
});

test("health do gateway de IA responde", async ({ request }) => {
  const res = await request.get("/api/public/ai-health");
  expect([200, 503]).toContain(res.status());
});