import { defineConfig, devices } from "@playwright/test";

// Rode local: bun run test:e2e
// Rode contra produção/Vercel: TEST_URL=https://... bun run test:e2e
const baseURL = process.env.TEST_URL || "http://localhost:8080";
// Permite apontar para um Chromium já instalado (sandbox/CI sem `playwright install`).
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Chromium mobile (Pixel 5) — o webkit não está disponível no ambiente de CI atual.
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});