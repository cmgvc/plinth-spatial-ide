import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  testIgnore: ["**/node_modules/**", "**/src/**", "**/*.test.ts"],

  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:5173/", 
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173/", 
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});