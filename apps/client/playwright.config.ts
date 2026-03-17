import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  testMatch: "**/*.spec.ts",

  testIgnore: ["**/node_modules/**", "**/src/**", "**/*.test.ts"],

  fullyParallel: true,
  use: {
    baseURL: "http://localhost:5173",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
