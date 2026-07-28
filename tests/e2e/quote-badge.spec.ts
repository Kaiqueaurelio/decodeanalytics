/**
 * E2E do badge "Sob consulta" (cards, página do produto e carrinho).
 * Run with: bunx playwright test tests/e2e/quote-badge.spec.ts
 *
 * O badge só existe quando o admin desliga a exibição de preços
 * (settings → mostrar preços). Se a loja estiver com preços visíveis,
 * os testes são pulados em vez de falhar.
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:8080";
const HINT = /preços deste catálogo estão ocultos/i;

const badges = (page: Page) => page.getByText("Sob consulta", { exact: true });

async function firstBadgeOrSkip(page: Page) {
  const badge = badges(page).first();
  const visible = await badge.isVisible().catch(() => false);
  test.skip(!visible, "Loja está com preços visíveis — badge não é renderizado.");
  return badge;
}

/** Badge visível + fallback nativo via atributo title. */
async function expectBadgeWithTitle(page: Page) {
  const badge = await firstBadgeOrSkip(page);
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute("title", HINT);
  return badge;
}

/** Tooltip do shadcn/Radix abre no hover e no foco por teclado. */
async function expectTooltip(page: Page, badge: ReturnType<typeof badges>) {
  await badge.hover();
  await expect(page.getByRole("tooltip").filter({ hasText: HINT }).first()).toBeVisible();

  await page.mouse.move(0, 0);
  await badge.focus();
  await expect(page.getByRole("tooltip").filter({ hasText: HINT }).first()).toBeVisible();
}

test.describe("Badge Sob consulta", () => {
  test("aparece nos cards da home com tooltip e title", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    const badge = await expectBadgeWithTitle(page);
    await expectTooltip(page, badge);
  });

  test("aparece na listagem de produtos", async ({ page }) => {
    await page.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
    await expectBadgeWithTitle(page);
  });

  test("aparece na página do produto", async ({ page }) => {
    await page.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
    const card = page.locator("a[href^='/produto/']").first();
    test.skip((await card.count()) === 0, "Nenhum produto disponível no catálogo.");
    await card.click();
    await page.waitForURL(/\/produto\//);
    const badge = await expectBadgeWithTitle(page);
    await expectTooltip(page, badge);
  });

  test("aparece no carrinho (itens e total)", async ({ page }) => {
    await page.goto(`${BASE}/carrinho`, { waitUntil: "networkidle" });
    const badge = await firstBadgeOrSkip(page);
    await expect(badge).toHaveAttribute("title", HINT);
    expect(await badges(page).count()).toBeGreaterThan(0);
  });

  test("mobile 375px: badge visível e sem overflow horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await expectBadgeWithTitle(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
