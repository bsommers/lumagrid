import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Regression gate, set just below measured coverage (97.8/91.8/94.5/97.8
      // lines/branches/functions/statements on 2026-11-07). Ratchet upward.
      include: ['src/**'],
      thresholds: { lines: 97, statements: 97, branches: 91, functions: 94 },
    },
  },
});
