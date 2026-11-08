import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Aliases point at the library source so the example needs no prior library build.
export default defineConfig({
  root: here('.'),
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^lumagrid\/viz$/, replacement: here('../src/viz/index.ts') },
      { find: /^lumagrid$/, replacement: here('../src/index.ts') },
    ],
  },
  build: { outDir: here('./dist'), emptyOutDir: true },
});
