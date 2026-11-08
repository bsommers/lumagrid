# Phase 5: Brand, docs & showcase - Pattern Map

**Mapped:** 2026-11-07
**Files analyzed:** ~30 (new/modified groups)
**Analogs found:** 17 / 30 (rest: no in-repo analog; use RESEARCH.md patterns)

All analogs below are git-tracked (verified via `git ls-files`: examples/*, etc/*, scripts/*, .githooks/pre-push).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `site/vite.config.ts` | config | build | `examples/vite.config.ts` | exact |
| `site/tsconfig.json` | config | build | `examples/tsconfig.json` | exact |
| `site/index.html`, `site/capture.html` | entry html | request-response | `examples/index.html` | exact |
| `site/src/main.tsx`, `App.tsx`, `sections/*` | component | request-response | `examples/src/main.tsx` | role-match |
| `examples/shared/demos.ts` (extract) + `examples/src/main.tsx` (modify) | data module | transform | `examples/src/main.tsx` L16-58 | exact (extract) |
| `site/src/theme/lumagridTheme.ts` | config/theme | transform | `src/theme/dark.ts` | exact |
| `site/src/styles/tokens.css`, `grid.css`, `brand/tokens.css` | style | n/a | RESEARCH Pattern 6 | none in repo |
| `.github/workflows/pages.yml` | config | event-driven | `.github/workflows/ci.yml` | role-match |
| `scripts/ci.sh` (modify) | script | batch | itself | exact |
| `scripts/api.sh`, `etc/api-extractor.*.json`, `etc/lumagrid*.api.md` (rename) | config | batch | existing files | exact |
| `scripts/build-brand.mjs`, `render-visuals.mjs`, `check-docs.mjs`, `brand/wordmark.mjs` | script | batch/file-I/O | `scripts/api.sh` (header/usage/set -e conventions only) | partial |
| `eslint.config.js` (modify: ignores + `.mjs` globals) | config | n/a | itself L7, L10-12 | exact |
| `package.json` (scripts, devDeps, repository/homepage/bugs) | config | n/a | itself L39-53 | exact |
| `typedoc.json`, `deno.json` (rename) | config | n/a | itself | exact |
| `src/__tests__/barrels.test.ts` (rename keys) | test | n/a | itself L19-44 | exact |
| `docs/guide/snippets/__tests__/snippets.test.tsx`, contrast test | test | transform | `src/__tests__/barrels.test.ts`, `vitest.config.ts` | role-match |
| `docs/guide/snippets/tsconfig.json` | config | build | `examples/tsconfig.json` | exact |
| `docs/guide/*.md`, `docs/{ARCHITECTURE,USING,PURPOSE}.md`, README | docs | n/a | `docs/STABILITY.md`, current README | role-match |
| `brand/*.svg`, icons, banner | asset | n/a | none | none |
| `vitest.config.ts` (add `lumagrid` alias) | config | n/a | `examples/vite.config.ts` alias block | role-match |

## Pattern Assignments

### `site/vite.config.ts` (config)
**Analog:** `examples/vite.config.ts` L1-18. Copy verbatim; add `base: '/lumagrid/'`, add aliases for `/transforms|/theme|/plugins` (specific first, bare name last), and `build.rollupOptions.input: {main, capture}`.
```ts
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
  root: here('.'),
  plugins: [react()],
  resolve: { alias: [
      { find: /^vizbox\/viz$/, replacement: here('../src/viz/index.ts') },
      { find: /^vizbox$/, replacement: here('../src/index.ts') },
  ] },
  build: { outDir: here('./dist'), emptyOutDir: true },
});
```
(rename `vizbox` -> `lumagrid`.)

### `site/tsconfig.json`, `docs/guide/snippets/tsconfig.json`
**Analog:** `examples/tsconfig.json` (all 12 lines): `extends ../tsconfig.json`, `noEmit`, `declaration:false`, `declarationMap:false`, `rootDir:".."`, `baseUrl:"."`, `paths` mapping every entry (`lumagrid`, `lumagrid/viz`, plus transforms/theme/plugins), `include`. Site adds `types:["vite/client"]`, include `["src","../examples/shared"]`. Snippets: adjust `rootDir`/paths relative (`../../../src/...`).

### `site/index.html`, `capture.html`
**Analog:** `examples/index.html` L1-12 (viewport meta, `<div id="root">`, `<script type="module" src="/src/main.tsx">`). Add favicon/manifest links using relative `./` (Pitfall 8), OG meta; capture.html adds `noindex`, no grid background.

### `examples/shared/demos.ts` + `site/src/*` (component, data)
**Analog:** `examples/src/main.tsx`. Move L16-58 (`sales: TransformedData`, `salesFields`, `views`) to shared module; keep the registration and provider pattern:
```tsx
[nativeBarPlugin, nativeLinePlugin, nativePiePlugin, nativeTablePlugin, nativeTreePlugin].forEach((p) => registerPlugin(p));
const salesFields = { valueField: 'revenue', labelField: 'region' };
const views = [{ id: 'bar', label: 'Bar', config: salesFields }, ...];
<ThemeProvider theme={mode}> ... <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
```
Site additionally registers `nativeChoroplethPlugin`, `nativeForceGraphPlugin` (exported from `src/viz/index.ts`). Imports pattern L1-11: `import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid'; import type { TransformedData } from 'lumagrid'; import {...} from 'lumagrid/viz'`. Use role field names (valueField/labelField/idField/colorField).

### `site/src/theme/lumagridTheme.ts`
**Analog:** `src/theme/dark.ts` L1-49. Same `ThemeDefinition` shape (`name`, `colors.{categorical,sequential,diverging}`, `typography`, `spacing`, `surface`, `text`); import type from `lumagrid/theme` instead of `./types.js`. Fill from D-07 tokens (surface.background `#05070A`, text.primary `#E6EDF3`, secondary `#9AA4B2`; avoid text <= `#6E7681`; categorical >= 3:1 on bg). `typography.fontFamily` e.g. `'Inter', ...` as in dark.ts L19.

### `.github/workflows/pages.yml`
**Analog:** `.github/workflows/ci.yml` (style): header comment explaining purpose, top-level `permissions: contents: read` (L20-21), `concurrency` (L16-18), `timeout-minutes` (L27), `actions/setup-node` with `cache: npm`, `npm ci --no-audit --no-fund` (L34). Differences: SHA-pin actions (SHA table in RESEARCH "Pages workflow"), `persist-credentials: false`, separate deploy job with `pages: write`, `id-token: write`, `cancel-in-progress: false`, node 22. Copy full YAML from RESEARCH L404-437.

### `scripts/ci.sh` (modify, D-21)
Add after `step "lint"` (L31) in both modes: `step "typecheck site"; npm run --silent typecheck:site` and docs typecheck/`docs:check` (cheap). No Playwright. Insert `site:build` in full branch near L38 only if <= +4 s (RESEARCH). Rename L2 comment `VizBox` -> `Lumagrid`. Keep `set -euo pipefail`, `step()` helper (L21).

### `scripts/*.mjs` (build-brand, render-visuals, check-docs)
**Analog (conventions):** `scripts/api.sh` L1-12 header documents usage per mode; `cd "$(dirname "$0")/.."` repo-root anchoring (L10) -> in ESM use `process.chdir(fileURLToPath(new URL('..', import.meta.url)))`; fail with exit code 2 on bad usage; clear `==>` step logging (L59). Core code from RESEARCH Patterns 2-4 (Playwright capture, ICO writer, wordmark). Requires `eslint.config.js` `.mjs` globals block.

### `eslint.config.js` (modify)
L7 ignores: append `'site/dist/**'`. Add after L19:
```js
{ files: ['**/*.mjs'], languageOptions: { globals: { ...globals.node } } },
```
(`globals` already imported L4.)

### `package.json`
Scripts block L39-53 style (`"examples:build": "vite build --config examples/vite.config.ts"`): add `site:build`, `site:dev`, `typecheck:site`, `typecheck:docs`, `docs:check`, `visuals`, `brand` analogously. Add `repository`, `homepage`, `bugs`. Exact-pin devDeps (no `^`) per Phase 4 04-05 convention (note current file uses `^` for older deps; new ones exact).

### Rename targets (modify)
- `etc/api-extractor.<entry>.json`: `"apiReport": { "reportFileName": "vizbox-viz.api.md" }` -> `lumagrid-viz.api.md` (index/plugins/theme/transforms/viz); `git mv etc/vizbox*.api.md etc/lumagrid*.api.md`; then `npm run api:update`.
- `scripts/api.sh` L2, `typedoc.json` L12 (`"name": "VizBox"`), `deno.json` L2, `examples/*`.
- `src/registry/index.ts` L25: `[uitoolbox]` -> `[lumagrid]` (the real IN-01 prefix). `src/plugins/recharts-adapter.ts` L75, L86: `'[vizbox] recharts-adapter: ...'` -> `[lumagrid]`.
- `src/__tests__/barrels.test.ts`: keys only (`'vizbox'`, `'vizbox/core'` ... L19-44) -> `'lumagrid...'`.
- Historical docs (D-04/D-20): prepend `> Historical document — the project was renamed from VizBox to Lumagrid in Phase 5.` to `plans/*.md`, `REBUILD.md`, `.security-reports/*.md`, `docs/superpowers/**/*.md`, `.ontology/*` header note (no content change).
- Full sed recipe: RESEARCH "Pattern 1".

### `vitest.config.ts` (modify)
Add `resolve.alias` using the same array form as `examples/vite.config.ts` L12-15 so guide snippets importing `lumagrid` resolve. Coverage `include: ['src/**']` (L14) means snippet tests do not affect thresholds.

### Tests (snippets, contrast, tokens-sync)
**Analog:** `src/__tests__/barrels.test.ts` (describe/it loop over a table, `expect(x, msg).toBeDefined()`); jsdom env + `vitest.setup.ts` from `vitest.config.ts` L7-8. Contrast helper: RESEARCH "WCAG contrast test".

### Docs (`docs/guide/**`, ARCHITECTURE/USING/PURPOSE, README)
Analog: `docs/STABILITY.md` (policy-doc tone, rename only), current README as content source (363 lines; move reference to guide). Snippet-sync pattern per RESEARCH "Guide code correctness". Follow `writing-user-guides` skill; backlink + TOC per page.

## Shared Patterns
- **Alias-to-source** (`examples/vite.config.ts` L12-15): specific subpath regex before bare name; used by site vite config, vitest config, and every tsconfig `paths`.
- **Local-gate-first** (`scripts/ci.sh`): no hosted heavy jobs; anything slow (Playwright, brand) stays off the gate.
- **Warning prefix**: `console.warn('[lumagrid] ...')` (src/registry/index.ts L24-27 shape).
- **Exact pins + install checkpoint**, human checkpoints for `gh repo rename`, push, Pages enable.
- **Never run `scripts/ci.sh` in a copy with symlinked node_modules** (npm ci empties real dir).

## No Analog Found
| File | Reason |
|---|---|
| `brand/*.svg`, chart icons, banner, social/OG | No existing brand assets; hand-author per RESEARCH Pattern 5 (64 viewBox grid) |
| `site/src/styles/grid.css`, `tokens.css` | No CSS in repo; RESEARCH Pattern 6 verbatim |
| `scripts/render-visuals.mjs`, `build-brand.mjs`, `wordmark.mjs` | No Node/Playwright scripts exist; RESEARCH Patterns 2-4 |
| `site/capture.html` entry component | No capture harness; RESEARCH Pattern 2 |
| Choropleth demo `projectedPaths` | No projection code; example shape in `src/viz/__tests__/choropleth.test.tsx` (`projectedPaths: { a: 'M0,0L1,1Z' }`) |
| `docs/guide/snippets/*.tsx` | New; compile against `src` via tsconfig paths |

## Metadata
**Search scope:** examples/, scripts/, etc/, src/theme, src/registry, src/__tests__, .github/workflows, root configs
**Extraction date:** 2026-11-07
**Note:** RESEARCH.md lines 500-644 (validation/open questions) were not read; planner should consult them directly.
