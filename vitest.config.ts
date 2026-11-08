import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Package-name imports from guide and site tests resolve to source (specific subpaths first).
    alias: [
      { find: /^lumagrid\/transforms$/, replacement: here('./src/transforms/index.ts') },
      { find: /^lumagrid\/theme$/, replacement: here('./src/theme/index.ts') },
      { find: /^lumagrid\/viz$/, replacement: here('./src/viz/index.ts') },
      { find: /^lumagrid\/plugins$/, replacement: here('./src/plugins/index.ts') },
      { find: /^lumagrid$/, replacement: here('./src/index.ts') },
    ],
  },
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
