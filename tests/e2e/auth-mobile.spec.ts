/**
 * E2E mobile keyboard/layout checks for /auth.
 * Run with: bunx playwright test tests/e2e/auth-mobile.spec.ts
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
  { name: "iPhone SE", viewport: devices["iPhone SE"].viewport },
  { name: "iPhone 13", viewport: devices["iPhone 13"].viewport },
  { name: "Pixel 5", viewport: devices["Pixel 5"].viewport },
];

for (const vp of viewports) {
  test.describe(`/auth on ${vp.name}`, () => {
    test.use({ viewport: vp.viewport, hasTouch: true });

    test("inputs recebem foco, aceitam digitação e sem overflow horizontal", async ({ page }) => {
      // A telemetria é emitida como CustomEvent('auth-telemetry'); acumulamos
      // num array no próprio window e lemos depois (sem expor funções).
      await page.addInitScript(() => {
        (window as unknown as { __tel: string[] }).__tel = [];
        window.addEventListener("auth-telemetry", (e) => {
          (window as unknown as { __tel: string[] }).__tel.push(
            String((e as CustomEvent).detail?.event ?? ""),
          );
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
      const telemetry = await page.evaluate(
        () => (window as unknown as { __tel: string[] }).__tel ?? [],
      );
      const focusEvents = telemetry.filter((t) => t === "auth_input_focus");
      expect(focusEvents.length).toBeGreaterThanOrEqual(1);

      // Botão Entrar visível na viewport
      const submit = page.getByRole("button", { name: /entrar/i });
      await expect(submit).toBeVisible();
    });
  });
}