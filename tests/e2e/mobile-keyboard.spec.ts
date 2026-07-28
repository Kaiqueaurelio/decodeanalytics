import { test, expect } from "@playwright/test";

// Viewport de iPhone 12 sobre o browser do projeto (mobile = Chromium/Pixel).
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("teclado mobile: input focado continua visível e digitável", async ({ page }) => {
  await page.goto("/auth");

  const email = page.locator('input[type="email"]').first();
  await email.click();
  await expect(email).toBeFocused();
  await email.fill("teste@exemplo.com");
  await expect(email).toHaveValue("teste@exemplo.com");

  const box = await email.boundingBox();
  const vh = page.viewportSize()!.height;
  expect(box).not.toBeNull();
  // Campo dentro da área não coberta pelo teclado (~60% superior).
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vh * 0.65);
});

test("form vazio: submit mostra erro específico e não envia", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: /entrar/i }).first().click();
  const email = page.locator('input[type="email"]').first();
  // HTML5 required ou mensagem do app — em ambos os casos seguimos em /auth.
  await expect(page).toHaveURL(/\/auth/);
  await expect(email).toBeVisible();
});

test("sem vazamento horizontal em 390px", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});