import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone 12"] });

test("input em foco fica visível na viewport (com safe-area) e some o foco ao sair", async ({ page }) => {
  await page.goto("/auth");

  const email = page.locator('input[type="email"]').first();
  await email.click();
  await expect(email).toBeFocused();

  const box = await email.boundingBox();
  const vh = page.viewportSize()!.height;
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vh);

  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await expect(email).not.toBeFocused();
});

test("scroll-behavior vira auto com prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/auth");
  const behavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(behavior).toBe("auto");
});
