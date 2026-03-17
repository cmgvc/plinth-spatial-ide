import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', 
  
  testMatch: '**/*.spec.ts', 
  
  testIgnore: '**/src/**', 

  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev -w apps/client',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});