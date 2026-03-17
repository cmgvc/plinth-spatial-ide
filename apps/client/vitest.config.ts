import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    include: ['src/utils/**/*.{test,spec}.ts'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
  },
  plugins: [react()],
});