/**
 * E2E mobile keyboard/layout checks for /auth.
 * Run with: bunx playwright test tests/e2e/auth-mobile.e2e.ts
 *
 * Playwright does not open a real mobile keyboard in Chromium, so we assert:
 *  1. Inputs receive focus on tap (heurística de "teclado abriria").
 *  2. Typing populates the value.
 *  3. No horizontal overflow at 320/375/390/412 px viewports.
 *  4. auth-telemetry events fire on focus.
 */
import { test, expect, devices } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:8080";

const viewports = [
  { name: "iPhone SE", ...devices["iPhone SE"] },
  { name: "iPhone 13", ...devices["iPhone 13"] },
  { name: "Pixel 5", ...devices["Pixel 5"] },
];

for (const vp of viewports) {
  test.describe(`/auth on ${vp.name}`, () => {
    test.use({ ...vp });

    test("inputs recebem foco, aceitam digitação e sem overflow horizontal", async ({ page }) => {
      const telemetry: unknown[] = [];
      await page.exposeFunction("__pushTelemetry", (d: unknown) => telemetry.push(d));
      await page.addInitScript(() => {
        window.addEventListener("auth-telemetry", (e) => {
          // @ts-expect-error injected
          window.__pushTelemetry((e as CustomEvent).detail);
        });
      });

      await page.goto(`${BASE}/auth`);

      // Sem overflow horizontal
      const [scrollW, clientW] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollW).toBeLessThanOrEqual(clientW + 1);

      const email = page.getByLabel("E-mail").first();
      await email.tap();
      await expect(email).toBeFocused();
      await email.fill("teste@example.com");
      await expect(email).toHaveValue("teste@example.com");

      const pwd = page.getByLabel("Senha").first();
      await pwd.tap();
      await expect(pwd).toBeFocused();
      await pwd.fill("segredo123");
      await expect(pwd).toHaveValue("segredo123");

      // Telemetria disparou pelo menos um focus event
      await page.waitForTimeout(100);
      const focusEvents = telemetry.filter(
        (t) => (t as { event?: string }).event === "auth_input_focus",
      );
      expect(focusEvents.length).toBeGreaterThanOrEqual(2);

      // Botão Entrar visível na viewport
      const submit = page.getByRole("button", { name: /entrar/i });
      await expect(submit).toBeVisible();
    });

    test("link de entrar na conta abre a tela de login", async ({ page }) => {
      await page.goto(BASE);

      const menuButton = page.getByRole("button", { name: "Menu" });
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.getByRole("link", { name: /Entrar na conta/i }).click();
      } else {
        await page.getByRole("link", { name: /^Entrar$/i }).click();
      }

      await page.waitForURL((url) => url.pathname === "/auth");
      await expect(page.getByRole("heading", { name: "Decode Analytics Gestão" })).toBeVisible();
      await expect(page.getByLabel("E-mail").first()).toBeVisible();
    });
  });
}