import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // The KaTeX-heavy markdown tests sit right at vitest's 5s default on slow
    // CI runners; a real hang still fails, just later.
    testTimeout: 20000,
  },
});
