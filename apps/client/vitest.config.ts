import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only look for files in the utils/src directory
    include: ['src/utils/**/*.{test,spec}.ts'],
    // Specifically tell it to stay out of the e2e folder
    exclude: ['**/e2e/**', '**/node_modules/**'],
  },
});