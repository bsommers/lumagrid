---
phase: 04-release-prep-1-0
reviewed: 2026-11-07T00:00:00Z
depth: standard
files_reviewed: 53
files_reviewed_list:
  - .gitignore
  - eslint.config.js
  - etc/api-extractor.base.json
  - etc/api-extractor.index.json
  - etc/api-extractor.plugins.json
  - etc/api-extractor.theme.json
  - etc/api-extractor.transforms.json
  - etc/api-extractor.viz.json
  - examples/src/main.tsx
  - package.json
  - scripts/api.sh
  - scripts/ci.sh
  - src/core/collapse-manager.tsx
  - src/core/container.tsx
  - src/core/index.ts
  - src/core/view-switcher.tsx
  - src/index.ts
  - src/plugins/d3-adapter.tsx
  - src/plugins/nivo-adapter.ts
  - src/plugins/recharts-adapter.ts
  - src/registry/index.ts
  - src/registry/native-plugin.tsx
  - src/registry/types.ts
  - src/theme/color-scale.ts
  - src/theme/dark.ts
  - src/theme/light.ts
  - src/theme/provider.tsx
  - src/theme/types.ts
  - src/transforms/aggregate.ts
  - src/transforms/flatten.ts
  - src/transforms/geo-normalize.ts
  - src/transforms/group-by.ts
  - src/transforms/index.ts
  - src/transforms/pipeline.ts
  - src/transforms/pivot.ts
  - src/transforms/types.ts
  - src/viz/choropleth.tsx
  - src/viz/data-table.tsx
  - src/viz/force-graph.tsx
  - src/viz/horizontal-bar-chart.tsx
  - src/viz/line-chart.tsx
  - src/viz/pie-chart.tsx
  - src/viz/plugins.ts
  - src/viz/tree-view.tsx
  - src/viz/types.ts
  - src/registry/__tests__/index.test.ts
  - src/transforms/__tests__/group-by.test.ts
  - src/viz/__tests__/choropleth.test.tsx
  - src/viz/__tests__/force-graph.test.tsx
  - src/viz/__tests__/horizontal-bar-chart.test.tsx
  - src/viz/__tests__/line-chart.test.tsx
  - src/viz/__tests__/pie-chart.test.tsx
  - typedoc.json
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-11-07
**Depth:** standard
**Files Reviewed:** 53
**Status:** issues_found

## Summary

Most of the diff is TSDoc tagging, and the tags are consistent. The real logic changes are the field-alias resolution (`valueField`/`labelField`/`idField` over the legacy `xField`/`yField`), the registry duplicate warning and returned id, the `groupBy` typing, and the API gate scripts. The alias resolution is correct and consistently ordered (role name, legacy alias, inference). The `groupBy` retyping is correct. No security issues were found. The weaknesses are in the registry duplicate warning and in how the API gate can pass on stale input.

## Warnings

### WR-01: Duplicate-registration warning is silent in browser bundles, where hot reload happens

**File:** `src/registry/index.ts:31`
**Issue:** The guard `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'` is false in a browser. Vite, webpack 5 and native ESM do not define a bare `process` for library code, and a `typeof process` check is not statically replaced the way `process.env.NODE_ENV` is. The TSDoc and the inline comment say the warning exists for hot reload, but hot reload is a browser dev-server scenario, so the warning only fires in Node, SSR and vitest. The test "neither throws nor warns when process is undefined" locks in this silent behavior.
**Fix:** Evaluate `NODE_ENV` in a way bundlers can substitute, behind a safe guard:
```ts
function isProduction(): boolean {
  try { return process.env.NODE_ENV === 'production'; } catch { return false; }
}
```
A bare `process.env.NODE_ENV` is replaced by Vite and webpack in the consumer build, so the `try` only matters when nothing replaces it. Alternatively, document that the warning is Node-only.

### WR-02: Duplicate warning also fires when the identical plugin object is re-registered

**File:** `src/registry/index.ts:31-36`
**Issue:** `plugins.has(plugin.id)` does not compare identity. Registering the same plugin object twice is idempotent and harmless, for example when two modules both call `registerPlugin(nativeBarPlugin)` or under React StrictMode double evaluation. It still logs a "replacing the earlier registration" warning. The noise trains users to ignore the one warning that is meant to flag a real id collision.
**Fix:** Warn only on a different object:
```ts
const existing = plugins.get(plugin.id);
if (existing !== undefined && existing !== plugin && /* env check */) { console.warn(...) }
```

### WR-03: `api:check` validates whatever is already in `dist/esm`, with no freshness or clean guarantee

**File:** `scripts/api.sh:56-60`, `package.json:52`
**Issue:** `check` only tests that `dist/esm/index.d.ts` exists. It never rebuilds. Run locally after editing `src/`, it compares the committed reports against stale declarations and can pass while the source has drifted. `tsc` also does not delete outputs for removed or renamed files, so a deleted export can linger in `dist/esm` and keep the report green or inject phantom symbols. `api:update` runs `build:esm` but also does not clean `dist/esm`, so a stale report can be committed. Only `scripts/ci.sh` is safe, because it builds immediately before the check.
**Fix:** Make the npm script self-contained and clean:
```json
"api:check": "rm -rf dist/esm && npm run build:esm && bash scripts/api.sh check",
"api:update": "rm -rf dist/esm && npm run build:esm && bash scripts/api.sh update"
```
Alternatively, have `api.sh` fail when any `src` file is newer than `dist/esm/index.d.ts`.

### WR-04: `ae-incompatible-release-tags` is disabled for every entry point, including the root

**File:** `etc/api-extractor.base.json:55-58`
**Issue:** The rule is turned off in the shared base to allow stable `createD3Plugin`, `createRechartsPlugin` and `createNivoPlugin` to take `@beta` option types. This only needs to apply to `plugins`, but it also silences the check for `index`, `viz`, `theme` and `transforms`. A future `@public` API that exposes an `@beta` or `@internal` type in those entry points will pass the gate. This undermines the D-10 intent of the gate. Note also that `VisualizationProps` (`src/viz/types.ts`) is tagged `@internal` and has no export, so the check is unproven for it.
**Fix:** Keep the rule at `warning` or `error` in the base and override it to `none` only in `etc/api-extractor.plugins.json`. The root `index` entry also re-exports the plugins types, so it may need the same override. Confirm which entry points actually need it.

## Info

### IN-01: Warning message prefix does not match the package name

**File:** `src/registry/index.ts:32`
**Issue:** The message prefix is `[uitoolbox]`, but the published package is `vizbox` (`package.json` name, api-extractor report name, typedoc name). Users will not connect the log line to the library.
**Fix:** Use `[vizbox]`.

### IN-02: Unanchored `temp/` gitignore pattern

**File:** `.gitignore:7`
**Issue:** `temp/` matches a directory of that name at any depth, for example a future `src/**/temp/` fixture directory. The api-extractor scratch folder is only `<root>/temp/`.
**Fix:** Use `/temp/` (and `/docs/api/`). Keep `eslint.config.js` consistent.

### IN-03: `parity` awk detection can misfire on `/**` inside strings or line comments

**File:** `scripts/api.sh:28-40`
**Issue:** Block start is any line containing `/**`, with no check that it is a real comment opener. A string literal or `// /**` line comment containing `/**` starts a phantom block, and the next `*/` ends it. Prose that mentions `@beta` or `@experimental` inside a block also counts as a tag. The current tree passes, but the check can produce false failures or false passes later. The `find` in the process substitution also hides failure from the loop.
**Fix:** Anchor the opener to `^[[:space:]]*/\*\*` and match tags only as `^[[:space:]]*\*?[[:space:]]*@(experimental|beta)\b`. Optionally `set -o pipefail`-check the `find`.

---

_Reviewed: 2026-11-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
