# Phase 4: Release prep (1.0) - Pattern Map

**Mapped:** 2026-11-07
**Files analyzed:** 17
**Analogs found:** 12 / 17 (no api-extractor/typedoc/CHANGELOG/STABILITY precedent in repo; none tracked under etc/)

## File Classification

| File | Role | Data Flow | Closest Analog | Match |
|------|------|-----------|----------------|-------|
| `src/registry/native-plugin.tsx` (NativeChartProps: add valueField/idField, @deprecated xField/yField) | model/type | transform | itself | exact |
| `src/viz/horizontal-bar-chart.tsx`, `line-chart.tsx`, `pie-chart.tsx`, `force-graph.tsx`, `choropleth.tsx` | component | transform | each other (same destructure + fallback idiom) | exact |
| `src/registry/index.ts` (warn on dup, return id, deprecate registerAndGetId) | service | CRUD | itself | exact |
| `src/registry/__tests__/index.test.ts` | test | CRUD | itself (`fakePlugin`, `beforeEach` reset) | exact |
| `src/transforms/group-by.ts` | utility | transform | `src/transforms/pivot.ts` (plain `ChainableTransform`) | exact |
| `src/transforms/__tests__/group-by.test.ts` | test | transform | remove casts | exact |
| TSDoc tags on all exports (`src/index.ts`, `src/{core,viz,plugins,theme,transforms}/index.ts`, `src/registry/types.ts`) | doc | n/a | TSDoc in `src/registry/index.ts` / `native-plugin.tsx` | role |
| `api-extractor.json` (+ per-entry configs), `etc/*.api.md` | config | batch | none | none |
| `typedoc.json`, `.gitignore` entry `docs/api/` | config | batch | none | none |
| `package.json` scripts | config | n/a | existing scripts block | exact |
| `scripts/ci.sh` | config | batch | itself (`step` helper) | exact |
| `CHANGELOG.md`, `docs/STABILITY.md`, README "Stability", `docs/RELEASE-PLAN.md` fix | doc | n/a | `docs/RELEASE-PLAN.md` | role |
| `examples/` + README snippets (xField/yField to role names) | component | n/a | existing usages | exact |

## Pattern Assignments

### Chart field aliasing (`src/viz/*.tsx`)
Current resolution idioms (copy and put new name first, then deprecated alias, then `data.fields` fallback; new wins per discretion):
- `horizontal-bar-chart.tsx:17-18`
```ts
const numericField = xField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
const labelField = yField ?? data.fields.find((f) => f.type === 'string')?.key ?? '';
```
  becomes `valueField ?? xField ?? ...` and `labelField ?? yField ?? ...`.
- `line-chart.tsx:17-18`: `numericField = yField ?? ...number`, `categoryField = xField ?? ...string|date` -> `valueField ?? yField`, `labelField ?? xField`. `colorField` unchanged (line 26-28).
- `pie-chart.tsx:42-43`: `valueField = yField ?? ...`, `labelField = xField ?? ...` -> prepend `valueField ??` / `labelField ??`. NOTE: local consts named `valueField`/`labelField` already exist; rename locals or destructure props with different local names to avoid shadowing.
- `force-graph.tsx:107,114-115`: `idField = xField ?? 'id'`, `labelField = yField ?? 'label'` -> `idField ?? xField ?? 'id'`, `labelField ?? yField ?? 'label'`. Same local/prop name collision: destructure props then compute `resolvedId`.
- `choropleth.tsx:21,35`: `const prop = valueProperty ?? yField ?? 'value';` -> `valueProperty ?? valueField ?? yField ?? 'value'`.
- `horizontal-bar-chart.tsx` also has local `labelField` const at line 18: same collision, rename.

**NativeChartProps** (`native-plugin.tsx:8-19`): keep index signature (D-03); add `valueField?`, `idField?`; mark old fields:
```ts
  /** @deprecated Use `valueField`/`labelField`/`idField` (chart-specific). Removed in 2.0. */
  xField?: string;
```
`createNativePlugin` (lines 29-48) needs no change (config spreads first).

### `src/registry/index.ts`
Existing (lines 6-11, 19-25):
```ts
export function registerPlugin<TData, TTheme, TConfig>(plugin: ChartPlugin<TData, TTheme, TConfig>): void {
  plugins.set(plugin.id, plugin as ChartPlugin<unknown, unknown, unknown>);
}
export function registerAndGetId<...>(plugin): string { registerPlugin(plugin); return plugin.id; }
```
Change: return `string`; before `set`, `if (plugins.has(id) && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') console.warn(...)`. Add `/** @deprecated Use registerPlugin, which now returns the id. */` to `registerAndGetId` (body can just `return registerPlugin(plugin)`). Keep `__resetRegistryForTests` JSDoc as-is (lines 27-35); tag `@internal`. Check eslint `no-console` config in `eslint.config.js` (--max-warnings 0).

**Tests** (`__tests__/index.test.ts:1-27`): imports from `'../index.js'`, `fakePlugin(id)`, `beforeEach(__resetRegistryForTests)`. Add `vi.spyOn(console,'warn').mockImplementation(()=>{})` for dup warn, return-id, and production-silent cases (stub `process.env.NODE_ENV`).

### `src/transforms/group-by.ts` (D-15)
Analog `pivot.ts:15-22`: `export const pivot: ChainableTransform<PivotOptions> = { name: 'pivot', transform(data, options) {...} }`. Current groupBy (lines 15-20) is declared as a union type but always a factory. Simplest fix (matches D-15 option 1, lower risk): declare
```ts
export const groupBy = (field: string, valueField?: string): ChainableTransform<GroupByOptions> => ({ name: 'groupBy', transform(data, options) {...} });
```
(drop the union annotation; body unchanged). Option 2 (plain ChainableTransform like pivot, factory kept as `@deprecated` alias) needs `options.field` required handling like pivot's `if (!options) return data`. Then remove casts in `src/transforms/__tests__/group-by.test.ts`. Export in `transforms/index.ts:20` unchanged.

### Config/scripts
`package.json` scripts block (lines 38-48) style: kebab/colon names, plain commands. Add:
```json
"docs:api": "typedoc",
"api:check": "api-extractor run --config etc/api-extractor.json",
"api:update": "api-extractor run --local --config etc/api-extractor.json"
```
(one config per subpath if using multiple reports: `.`, transforms, theme, viz, plugins; `mainEntryPointFilePath` = `dist/esm/<sub>/index.d.ts`; set `tsdocMessageReporting`/`ae-missing-release-tag` to `error` to enforce D-10.) Add devDeps `@microsoft/api-extractor`, `typedoc`. Gitignore `docs/api/`.

`scripts/ci.sh` pattern (lines 25-39): `step() {...}` then `step "name"; npm run --silent <script>`. Insert in the non-fast branch after build and before examples build:
```bash
  step "build";    npm run --silent build
  step "api report"; npm run --silent api:check
```
Update header comment (lines 4-8) and note mirror in `.github/workflows/ci.yml` ("keep the two in step", line 10).

### TSDoc
Style: `/** ... */` with `@example` (native-plugin.tsx:24-28). Add `@public` or `@experimental` as last tag on every export in the five subpath barrels' source declarations (re-exports inherit the tag from the declaration). D-08/D-09 lists define which. Types in `src/registry/types.ts` already have TSDoc; just append tags.

### Docs
No CHANGELOG/STABILITY precedent; use Keep a Changelog headings (Unreleased: Added/Changed/Deprecated/Fixed) and `docs/RELEASE-PLAN.md` for policy wording; fix its `component` vs `Renderer` mistake and replace duplicated stability text with a link to `docs/STABILITY.md`.

## Shared Patterns
- ESM relative imports with `.js` suffix; `import type` for types.
- `--max-warnings 0` lint and coverage thresholds: new branches (alias fallbacks, warn paths) need tests; do not lower thresholds.
- Deprecations get a matching CHANGELOG "Deprecated" entry (D-04).

## No Analog Found
api-extractor config + committed reports, typedoc config, CHANGELOG.md, STABILITY.md: use tool docs / RESEARCH-less defaults.

## Metadata
**Search scope:** src/, scripts/, package.json, docs/. Analogs are all tracked source. **Date:** 2026-11-07
