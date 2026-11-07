# Release plan: 0.1.0 to 1.0

Status at 0.1.0: four layers (theme, transforms, registry/core, viz/plugins), seven native charts, D3/Recharts/Nivo adapters, ~140 tests with a coverage gate, lint, and an `examples/` app.

## Versioning policy

- SemVer. While `0.x`, minor bumps may break; patch bumps never do. From 1.0, breaking changes only in majors.
- Conventional-commit subjects drive the changelog; keep a `CHANGELOG.md` (Keep a Changelog format) updated per release.
- Tag `vX.Y.Z` on main after `typecheck`, `lint`, `test:coverage`, `build`, `examples:build` all pass locally.

## 0.2 - correctness and hygiene

- Add a `ViewSpec` and `NativeChartProps` audit: every native chart honours `xField`/`yField`/`colorField`/`ariaLabel` consistently (field meaning currently differs: bar uses `xField` for the value, pie uses `yField`).
- `ForceGraph` only simulates on mount; re-run layout when `data` changes, and make initial placement deterministic (seeded) so tests and SSR are stable.
- `LineChart` `toPath` sorts input in place; copy first. Treat dates on the x-axis as a real scale rather than an index.
- Resolve the `registerPlugin` global registry behaviour (duplicate ids silently overwrite): decide on warn/throw, document the registry-reset convention for tests.
- Raise coverage thresholds as gaps close (branches in `line-chart`, `data-table`; `src/index.ts` and `viz/plugins.ts` barrel files are excluded or smoke-tested).
- Decide on the Deno story (`deno.json` exists): either test in CI or drop.

## 0.3 - API freeze candidates

Candidates to lock for 1.0 (everything else stays experimental, marked `@experimental` in TSDoc):

- `ThemeDefinition` token shape and `ThemeProvider`.
- `DataTransform`/`TransformedData`/`HierarchyNode`/`GeoData` types and the built-in transforms' signatures.
- `ChartPlugin` contract (`dataAdapter`, `themeAdapter`, `component`), `registerPlugin`/`getPlugin`/`listPlugins`, `createNativePlugin`.
- `WidgetContainer` and `ViewSwitcher` props.
- Package export map: `vizbox`, `/transforms`, `/theme`, `/viz`, `/plugins`.

Likely to change before freeze: `NativeChartProps` field naming, adapter config shapes (`D3Theme`, `RechartsConfig`, `NivoTheme`), `Choropleth` projection API, `registerAndGetId`.

## Deprecations

- Mark anything renamed in 0.2/0.3 with `@deprecated` TSDoc and keep it for at least one minor release; remove at the next major.
- Document each deprecation in the changelog under "Deprecated".

## Publishing to npm

1. Confirm package name availability (`vizbox`) or move to a scope.
2. Finalise `package.json`: `repository`, `bugs`, `homepage`, `sideEffects: false`, `engines`, `peerDependencies` (react, react-dom; d3/recharts/nivo optional), `files`.
3. Add a `prepublishOnly` script running typecheck, lint, test, build; verify with `npm pack --dry-run` and install the tarball into `examples/`.
4. Check `exports` resolve for both ESM and CJS consumers (e.g. `publint`, `arethetypeswrong`).
5. Publish `0.x` with `--tag next`, promote to `latest` at 1.0. Use npm provenance when CI is available again.

## Docs and examples

- README quickstart verified against `examples/`; one example per plugin family (native, D3, Recharts, Nivo).
- API reference generated from TSDoc (typedoc) once the surface is frozen.
- Accessibility notes per chart (aria-label, keyboard behaviour for `TreeView`, `DataTable`).

## Remaining before 1.0

- CI back on (currently on hold): typecheck, lint, coverage, build, examples build.
- Visual regression or screenshot tests for the SVG charts.
- Performance guidance (ForceGraph is O(n^2) per iteration; large tables need virtualisation).
- Bundle-size budget and tree-shaking check on the per-layer entry points.
- SSR check (no `window` access at import time; ResizeObserver guarded).
- Two release candidates (`1.0.0-rc.1`, `-rc.2`) with no API changes between the last rc and 1.0.
