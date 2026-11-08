import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Aliases point at the library source so the site needs no prior library build.
// Specific subpaths first, the bare package name last.
export default defineConfig({
  root: here('.'),
  base: '/lumagrid/',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^lumagrid\/transforms$/, replacement: here('../src/transforms/index.ts') },
      { find: /^lumagrid\/theme$/, replacement: here('../src/theme/index.ts') },
      { find: /^lumagrid\/viz$/, replacement: here('../src/viz/index.ts') },
      { find: /^lumagrid\/plugins$/, replacement: here('../src/plugins/index.ts') },
      { find: /^lumagrid$/, replacement: here('../src/index.ts') },
    ],
  },
  // The dev server stays on localhost (host is not set) and may only read the repository root.
  server: { fs: { allow: [here('..')] } },
  build: {
    outDir: here('./dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        capture: here('./capture.html'),
      },
    },
  },
});
