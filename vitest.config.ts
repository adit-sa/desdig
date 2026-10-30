import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    globals: true,
    testTimeout: 15000,
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  },
});
