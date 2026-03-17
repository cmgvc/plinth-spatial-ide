import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/utils/**/*.{test,spec}.ts'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
  },
});