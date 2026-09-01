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
      // Reporting only, not gating — see .planning/test-suite-qa-review-2026-08-09.md
      // P3 item 13. No thresholds until a realistic floor is agreed on.
    },
  },
});
