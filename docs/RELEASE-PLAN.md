# Release plan: 0.1.0 to 1.0

Status at 0.1.0: four layers (theme, transforms, registry/core, viz/plugins), eleven native charts, D3/Recharts/Nivo adapters, ~140 tests with a coverage gate, lint, and an `examples/` app.

## Versioning policy

- SemVer. While `0.x`, minor bumps may break; patch bumps never do. From 1.0, breaking changes only in majors.
- Conventional-commit subjects drive the changelog; keep a `CHANGELOG.md` (Keep a Changelog format) updated per release.
- Tag `vX.Y.Z` on main after `typecheck`, `lint`, `test:coverage`, `build`, `examples:build` all pass locally.

## 0.2 - correctness and hygiene

- ~~Add a `ViewSpec` and `NativeChartProps` audit: every native chart honours `xField`/`yField`/`colorField`/`ariaLabel` consistently (field meaning currently differs: bar uses `xField` for the value, pie uses `yField`).~~ Done 2026-11-07: every native chart takes role-named props (`valueField`, `labelField`, `idField`, `colorField`); `xField`/`yField` are deprecated aliases. See [STABILITY.md](STABILITY.md#field-props).
- ~~`ForceGraph` only simulates on mount~~ — done 2026-11-07: relayouts when nodes/edges change (warm-started), `relayout={false}` opt-out, seeded deterministic placement (`seed`), aspect-preserving fit so resizes don't relayout.
- `LineChart` `toPath` sorts input in place; copy first. Treat dates on the x-axis as a real scale rather than an index.
- ~~Resolve the `registerPlugin` global registry behaviour (duplicate ids silently overwrite): decide on warn/throw, document the registry-reset convention for tests.~~ Done 2026-11-07: duplicate ids warn outside production and then replace; `registerPlugin` returns the id. The reset convention is in [STABILITY.md](STABILITY.md#registry-test-convention).
- Raise coverage thresholds as gaps close (2026-11-07: 97.8/91.8/94.5 lines/branches/funcs, barrels and transforms covered; remaining: `theme/color-scale.ts` branches ~36%, then pie-chart, container, tree-view).
- Decide on the Deno story (`deno.json` exists): either test in CI or drop.

## 0.3 - API freeze candidates

The freeze scope is the stable (`@public`) list in [STABILITY.md](STABILITY.md). Everything marked `@experimental` in TSDoc stays outside the 1.0 contract; that list is in the same document.

## Deprecations

- Mark anything renamed in 0.2/0.3 with `@deprecated` TSDoc and keep it for at least one minor release; remove at the next major.
- Document each deprecation in the changelog under "Deprecated".

## Publishing to npm

> **TODO — deferred by owner (2026-11-07).** Not started; do not publish until explicitly requested.

1. Confirm package name availability (`lumagrid`) or move to a scope.
2. Finalise `package.json`: `repository`, `bugs`, `homepage`, `sideEffects: false`, `engines`, `peerDependencies` (react, react-dom; d3/recharts/nivo optional), `files`.
3. Add a `prepublishOnly` script running typecheck, lint, test, build; verify with `npm pack --dry-run` and install the tarball into `examples/`.
4. Check `exports` resolve for both ESM and CJS consumers (e.g. `publint`, `arethetypeswrong`).
5. Publish `0.x` with `--tag next`, promote to `latest` at 1.0. Use npm provenance when CI is available again.

## Docs and examples

- README quickstart verified against `examples/`; one example per plugin family (native, D3, Recharts, Nivo).
- ~~API reference generated from TSDoc (typedoc) once the surface is frozen.~~ Done: `npm run docs:api` (typedoc).
- Accessibility notes per chart (aria-label, keyboard behaviour for `TreeView`, `DataTable`).

## Remaining before 1.0

- CI back on (currently on hold): typecheck, lint, coverage, build, examples build.
- Visual regression or screenshot tests for the SVG charts.
- Performance guidance (ForceGraph is O(n^2) per iteration; large tables need virtualisation).
- Bundle-size budget and tree-shaking check on the per-layer entry points.
- SSR check (no `window` access at import time; ResizeObserver guarded).
- Two release candidates (`1.0.0-rc.1`, `-rc.2`) with no API changes between the last rc and 1.0.
