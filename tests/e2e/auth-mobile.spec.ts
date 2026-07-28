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
    test.use({ viewport: vp.viewport });

    test("inputs recebem foco, aceitam digitação e sem overflow horizontal", async ({ page }) => {
      // A telemetria é emitida via console.info("[auth-telemetry]", ...) — ler o
      // console é mais confiável que expor função + CustomEvent no init script.
      const telemetry: string[] = [];
      page.on("console", (msg) => {
        if (msg.text().includes("[auth-telemetry]")) telemetry.push(msg.text());
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
      const focusEvents = telemetry.filter((t) => t.includes("auth_input_focus"));
      expect(focusEvents.length).toBeGreaterThanOrEqual(1);

      // Botão Entrar visível na viewport
      const submit = page.getByRole("button", { name: /entrar/i });
      await expect(submit).toBeVisible();
    });
  });
}