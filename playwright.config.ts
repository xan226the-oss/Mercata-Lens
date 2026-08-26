import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"]],
  outputDir: "/tmp/mercata-lens-playwright",
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: "chrome",
    screenshot: "off",
    trace: "off",
    outputDir: "/tmp/mercata-lens-playwright",
  },
  projects: [
    { name: "required-viewports", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "corepack pnpm dev --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
