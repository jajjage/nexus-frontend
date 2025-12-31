import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.CI
      ? "http://127.0.0.1:3001"
      : "https://127.0.0.1:3001",
    trace: "on-first-retry",
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI ? "pnpm dev:next" : "pnpm dev",
    url: process.env.CI ? "http://127.0.0.1:3001" : "https://127.0.0.1:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 240 * 1000,
  },
});
