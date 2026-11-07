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
      // Regression gate, set just below measured coverage (81.5/84.5/80.3/81.5
      // lines/branches/functions/statements at time of writing). Ratchet upward.
      include: ['src/**'],
      thresholds: { lines: 81, statements: 81, branches: 87, functions: 80 },
    },
  },
});
