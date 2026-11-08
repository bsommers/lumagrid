# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Role-named field props on every native chart: `valueField`, `labelField`, `idField` and `colorField`. See the field props table in `README.md` and `docs/STABILITY.md`. `HorizontalBarChart` (45dab13), `LineChart` and `PieChart` (e332b78), `ForceGraph` and `Choropleth` (4e0c621).
- `ForceGraph` options `relayout`, `seed` and `iterations` (experimental) (4285c68).
- `docs/STABILITY.md`: what the `@public`, `@experimental` and `@deprecated` tags promise, the stable and experimental lists, the field props, the registry semantics and the registry test convention.
- Stability tags on the exported API: `@public` on stable exports and `@experimental` (paired with `@beta`) on experimental ones (132c085, 5bbdf3c, 0f2e5cf, 1b930ca, b09880e).
- `PipelineStep` is exported from the transforms entry point (5bbdf3c).
- API tooling: `npm run docs:api` generates the API reference with typedoc into `docs/api/` (gitignored); `npm run api:check` and `npm run api:update` run api-extractor against the built declarations (7dd145e, 98c145b, bb0236f).
- Committed API reports under `etc/` (one per entry point: root, `/transforms`, `/theme`, `/viz`, `/plugins`). `scripts/ci.sh` runs `api:check` after the build and fails when the public surface changes without an updated report or an export has no release tag. `npm run docs:api` now fails on any typedoc warning.
- The package root exports the prop and option types that its public signatures reference: `PieChartProps`, `ChoroplethProps`, `ForceGraphProps`, `TreeViewProps`, `D3PluginOptions`, `NivoPluginOptions`, `RechartsRow`, `PipelineStep` and `AnyTransform`.
- Examples app: a Vite + React app under `examples/`, with `npm run examples:build` (cf089dc).
- Flat ESLint config with typescript-eslint and react-hooks rules, and a `lint` script (a6aaa35).
- Local-first CI gate: `scripts/ci.sh` and a pre-push hook, with a minimal hosted backstop (379954d).
- Coverage regression thresholds in `vitest.config.ts` (9f74aee, 1b70888).

### Changed

- **BREAKING**: the package is renamed from `vizbox` to `lumagrid`. The entry points are `lumagrid`, `lumagrid/transforms`, `lumagrid/theme`, `lumagrid/viz` and `lumagrid/plugins`. There is no `vizbox` alias. The console warning prefix is `[lumagrid]`.
- `registerPlugin` returns the plugin id (`string`; it returned `void` before). Outside production it logs a `console.warn` when it replaces an existing id. It still replaces the earlier plugin (242b566).
- `ForceGraph` relayouts when the set of nodes or edges changes, warm-started from the previous positions. `relayout={false}` keeps existing positions (4285c68).
- `groupBy`'s declared type is now its real factory signature, `(field, valueField?) => ChainableTransform<GroupByOptions>`. There is no runtime change (0eecd9a).
- Licensed under Apache-2.0 (6660dda).

### Deprecated

- `NativeChartProps.xField` and `NativeChartProps.yField` are deprecated and will be removed in 2.0. The role name wins when both are passed. No runtime warning is emitted. Mapping per chart:
  - HorizontalBarChart: `xField` maps to `valueField`; `yField` maps to `labelField`.
  - LineChart: `xField` maps to `labelField`; `yField` maps to `valueField`.
  - PieChart: `yField` maps to `valueField`; `xField` maps to `labelField`.
  - ForceGraph: `xField` maps to `idField`; `yField` maps to `labelField`.
  - Choropleth: `yField` maps to `valueField`. `valueProperty` still takes precedence.
- `registerAndGetId` is deprecated and will be removed in 2.0. Use `registerPlugin`, which now returns the id.

### Fixed

- NaN and zero-division guards in LineChart, PieChart, ForceGraph and Choropleth (f6eef36). PieChart renders a lone 100% slice as a full circle instead of an empty arc.
- Choropleth tooltip shows an em dash instead of `NaN` for non-finite values (b765864).
- ForceGraph nodes no longer bunch into a corner after a resize. The render fit is a uniform, centred scale (4285c68).
- `groupBy(...).transform(...)` typechecks without a cast (0eecd9a).

## [0.1.0]

- Baseline: four layers (theme, transforms, registry/core, viz/plugins), seven native charts, D3/Recharts/Nivo adapters, a coverage-gated test suite, lint, and an `examples/` app.
