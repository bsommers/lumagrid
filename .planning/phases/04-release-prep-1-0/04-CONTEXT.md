# Phase 4: Release prep (1.0) - Context

**Gathered:** 2026-11-07
**Status:** Ready for planning

<domain>
## Phase Boundary

REL-03: freeze and document the public API of `vizbox` for 1.0. That means consistent field naming across the native charts, defined registry semantics, an explicit stability tag on every export, a generated API reference, a CI gate on the public surface, a changelog and a stability policy.

Out of scope for this context:
- REL-02 npm publish. Deferred by the owner; do not start it until they ask.
- REL-01 relicense. Already done in `6660dda`.
- Coverage gaps (`src/index.ts` and `src/viz/plugins.ts` barrels at 0%, `data-table` branches). These are tracked separately as a quick task.

</domain>

<decisions>
## Implementation Decisions

### Chart field naming (NativeChartProps)
- **D-01:** Field props are named by role, not by axis: `valueField`, `labelField`, `idField`, `colorField`. Each name means the same thing in every native chart. — **Reversibility:** one-way — once 1.0 ships, renaming these props again needs a major version.
- **D-02:** `xField` and `yField` remain as `@deprecated` aliases (TSDoc), mapped per chart to the new role names, and are removed in 2.0. The current per-chart meanings that the aliases must preserve:
  - HorizontalBarChart: `xField` → `valueField`, `yField` → `labelField`
  - LineChart: `xField` → `labelField` (category axis), `yField` → `valueField`
  - PieChart: `yField` → `valueField`, `xField` → `labelField`
  - ForceGraph: `xField` → `idField`, `yField` → `labelField`
  - Choropleth: `yField` → `valueField` (the existing `valueProperty` keeps precedence)
  - The existing `labelField` prop on NativeChartProps becomes the canonical role name and is no longer an extra.
- **D-03:** Keep the `[key: string]: unknown` index signature on `NativeChartProps`, so chart-specific extras still flow through `config`.
- **D-04:** List each deprecation under "Deprecated" in CHANGELOG.md, following the policy in `docs/RELEASE-PLAN.md`.

### Plugin registry
- **D-05:** When `registerPlugin` gets an id that is already registered, it calls `console.warn` (only when `process.env.NODE_ENV !== 'production'`, guarded so it's safe where `process` is undefined) and then overwrites. HMR and test re-registration keep working.
- **D-06:** `registerPlugin` returns the plugin id (today it returns `void`, so this doesn't break callers). `registerAndGetId` is marked `@deprecated` and kept until 2.0.
- **D-07:** No public `unregisterPlugin` or reset function. `__resetRegistryForTests` stays internal. The test convention (import it directly and call it in `beforeEach`) is documented in `docs/STABILITY.md` or the testing notes.

### Freeze scope and stability marking
- **D-08:** Stable (`@public`): the theme layer (`ThemeDefinition` tokens, `ThemeProvider`, `useTheme`, `lightTheme`/`darkTheme`, color scales); transform types and built-in transform signatures; the `ChartPlugin` contract (the code calls the field `Renderer`; correct `RELEASE-PLAN.md`, which says `component`), `registerPlugin`/`getPlugin`/`listPlugins`, `createNativePlugin`, `ViewSpec`, `RendererProps`; `WidgetContainer`, `ViewSwitcher`, `CollapseManager`, `useCollapse` and their props types; all seven native chart components and their core props; the `native*Plugin` presets; the adapter factories `createD3Plugin`, `createRechartsPlugin`, `createNivoPlugin`; the package export map (`.`, `/transforms`, `/theme`, `/viz`, `/plugins`). — **Reversibility:** one-way — 1.0 publishes the semver contract.
- **D-09:** Experimental (`@experimental`), allowed to change in a minor release: the adapter config and theme shapes (`D3Theme`, `D3PluginOptions`, `RechartsTheme`, `RechartsRow`, `RechartsConfig`, `NivoTheme`, `NivoPluginOptions`) and the `rechartsThemeAdapter`/`nivoThemeAdapter` helpers; the Choropleth projection API; the ForceGraph extras (`seed`, `relayout`, `iterations`).
- **D-10:** Stability is expressed only through TSDoc tags. Every exported symbol carries `@public` or `@experimental`; an untagged export fails the API-report check (D-12). There is no separate `vizbox/experimental` subpath.

### Documentation and gates
- **D-11:** The API reference is generated with typedoc from TSDoc (`npm run docs:api`) into `docs/api/`.
- **D-12:** api-extractor writes a committed API report (e.g. `etc/vizbox.api.md`, one per entry point if needed). `scripts/ci.sh` fails when the public surface changes without an updated report, and enforces the release tags from D-10.
- **D-13:** Create `CHANGELOG.md` now in Keep a Changelog format, with a 0.1.0 baseline and an Unreleased section backfilled with the work since 0.1.0 (Apache-2.0 relicense, ForceGraph relayout/seed/aspect fit, LineChart NaN fix, pie and choropleth fixes, examples app, ESLint, local CI gate) plus this phase's renames and deprecations.
- **D-14:** The stability policy lives in a new `docs/STABILITY.md`: what `@public`/`@experimental`/`@deprecated` promise, the deprecation window, and the registry test convention. The README gets a short "Stability" section linking to it, and `docs/RELEASE-PLAN.md` points to it rather than duplicating it.

### Claude's Discretion
- Whether the typedoc output in `docs/api/` is committed or gitignored. Default: gitignored and generated on demand.
- When an old and a new field name are both passed, the new name wins (and the dev warning stays quiet).
- Whether api-extractor uses one report per subpath entry or a single rolled-up report.
- Exact wording and placement of the dev-mode duplicate-id warning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Release policy
- `docs/RELEASE-PLAN.md` — versioning policy, the 0.2/0.3 candidate lists, deprecation rules, and the "remaining before 1.0" list. Fix its `component` vs `Renderer` error.
- `.planning/REQUIREMENTS.md` — REL-03 (this phase), REL-02 (deferred).

### Public surface
- `src/index.ts` — top-level barrel; the full surface to tag.
- `src/core/index.ts`, `src/viz/index.ts`, `src/plugins/index.ts`, `src/theme/index.ts`, `src/transforms/index.ts` — subpath entry points (export map in `package.json`).
- `src/registry/types.ts` — `ChartPlugin`, `ViewSpec`, `RendererProps`.
- `src/registry/index.ts` — registry functions and `__resetRegistryForTests`.
- `src/registry/native-plugin.tsx` — `NativeChartProps`, `NativeConfig`, `createNativePlugin`.
- `src/viz/horizontal-bar-chart.tsx`, `line-chart.tsx`, `pie-chart.tsx`, `force-graph.tsx`, `choropleth.tsx` — where field names are resolved today (the per-chart alias mapping in D-02).

### Gates
- `scripts/ci.sh` — local-first CI gate; the api-extractor check goes here.
- `vitest.config.ts` — coverage thresholds (don't lower them).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createNativePlugin` in `src/registry/native-plugin.tsx` spreads `config` before the real props, so field aliases can be resolved inside each chart component without changing the plugin wrapper.
- The registry tests are in `src/registry/__tests__/index.test.ts`; extend them for the duplicate warning and the returned id.
- `examples/` (Vite app aliased to `src`) and README snippets use `xField`/`yField`. Migrate them to the role names as living proof that the new names work.

### Established Patterns
- Field inference falls back to `data.fields` metadata (first `number` field for the value, first `string`/`date` field for the label). Keep that fallback after the rename.
- TSDoc already appears on the registry types; extend the same style to every export.
- Conventional-commit subjects feed the changelog.

### Integration Points
- `package.json` scripts: add `docs:api` (typedoc) and an `api:check`/`api:update` (api-extractor) step; wire `api:check` into `scripts/ci.sh`.
- api-extractor reads the emitted `.d.ts` in `dist/esm`, so it runs after `build`.

</code_context>

<specifics>
## Specific Ideas

- Nothing has been published to npm yet, but keep the deprecated aliases anyway (owner's choice) for the examples and anyone using the GitHub source.

</specifics>

<deferred>
## Deferred Ideas

- REL-02 npm publish and its package.json fields (`sideEffects`, optional peer deps for recharts/nivo, `prepublishOnly`, publint/attw). Deferred by the owner.
- 0.2 correctness items in `docs/RELEASE-PLAN.md` (LineChart `toPath` in-place sort, date x-scale, Deno story). Not discussed; a candidate for a separate quick task or phase.
- Visual regression tests, bundle-size budget, SSR check, rc.1/rc.2 cadence. These are 1.0 readiness work outside REL-03.

</deferred>

---

*Phase: 04-release-prep-1-0*
*Context gathered: 2026-11-07*
