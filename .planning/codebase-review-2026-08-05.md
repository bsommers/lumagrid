# Codebase Review — VizBox
**Date**: 2026-08-05
**Grade**: B+ (solid architecture, immature project scaffolding)
**Method**: Built a graphify knowledge graph of the repo (`graphify-out/graph.json`, 319 nodes / 720 edges / 13 communities), then verified findings against the actual source, `package.json`, `tsconfig.json`, `.security-reports/scan-2026-04-05.md`, `.planning/phases/01-plugin-architecture/.continue-here.md`, and `plans/refactor-plugin-architecture.md`.

---

## What's genuinely good

**Architecture (A-).** The plugin refactor (`da94f7a`) is well executed. `ChartPlugin<TData, TTheme, TConfig>` with `dataAdapter` / `themeAdapter` / `Renderer` (`src/registry/types.ts`) is a clean, minimal contract — `ViewSwitcher` (`src/core/view-switcher.tsx`) is a pure dispatcher that knows nothing about D3, Recharts, or native SVG internals. Adding a new chart library is genuinely just "write an adapter, call `registerPlugin`." The old dual-registry / layer-violation problems documented in `plans/refactor-plugin-architecture.md` are actually gone — verified `src/core/registry.ts` and `src/viz/registry.ts` no longer exist, matching the plan.

**Type discipline (A).** `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` all on in `tsconfig.json`. `DataRow = Record<string, string | number | boolean | null>` (`src/transforms/types.ts:7`) is a smart, deliberate primitive-only boundary that closes off a whole class of prototype-pollution and object-injection bugs for free.

**Security (A, per `.security-reports/scan-2026-04-05.md`, independently confirmed).** No `dangerouslySetInnerHTML`, no `eval`, no network calls, immutable transforms throughout. Only finding: informational Low on non-cryptographic `Math.random()` in `ForceGraph` layout — already has a JSDoc explaining the intent, appropriately low-stakes.

**Responsiveness done right.** `WidgetContainer`'s `ResizeObserver` (`src/core/container.tsx`) only activates when width/height are CSS strings — skipped entirely for fixed numeric sizing. Easy corner to cut; wasn't.

## What's dragging the grade down

**Test coverage is a real gap, not a nitpick.** Only `src/transforms/__tests__/` has tests (3 files, transforms only: `aggregate.test.ts`, `flatten.test.ts`, `pipeline.test.ts`). Zero tests for `registry/`, `plugins/` (D3 + Recharts adapters), `core/` (`ViewSwitcher`, `WidgetContainer`, `CollapseManager`), `theme/`, or any of the 7 viz components. The completion-status doc says this itself: *"Possible follow-on work: Write tests for `registerPlugin` / `ViewSwitcher` with plugin adapter flow"* — flagged by the authors and never picked up. For a library whose value proposition is a plugin *contract*, the contract itself (`dataAdapter` → `themeAdapter` → `Renderer` wiring) is the most valuable thing to test, and it's untested.

**No CI.** No `.github/workflows`. `npm run test` and `npm run typecheck` exist as scripts but nothing runs them automatically on push/PR.

**No ESLint config, but ESLint-shaped code.** `src/viz/force-graph.tsx:102` has `// eslint-disable-next-line react-hooks/exhaustive-deps` — a directive for a linter that isn't configured anywhere in the repo. Either the config was lost, or it's cargo-culted. Resolve one way or the other.

**License mismatch.** `package.json` declares `"license": "MIT"` but there's no `LICENSE` file in the repo root. Trivial fix; blocks legal/compliance review if ever published.

**No usage example beyond README.** No `examples/` app, no Storybook. "Does it actually render together" is currently unverified outside manual review.

## Concrete suggestions

**Improve:**
1. Add tests for `registerPlugin`/`getPlugin`/`ViewSwitcher` — render a fake `ChartPlugin`, assert `dataAdapter`→`themeAdapter`→`Renderer` receives the right props. Highest-leverage test in the repo.
2. Add a GitHub Actions workflow: `typecheck` + `test` on PR, minimum.
3. Add `LICENSE` file matching the declared MIT license.

**Change:**
4. Either add an ESLint config matching the existing `eslint-disable` comment, or remove the stray directive in `src/viz/force-graph.tsx` if nothing enforces it.
5. `ForceGraph`'s layout simulation is O(n²) per iteration × 60 iterations (`src/viz/force-graph.tsx:29-42`) — fine at dashboard-widget scale, but worth a doc comment noting the node-count ceiling before someone feeds it thousands of rows.

**Eliminate:**
6. `createD3Visualization` / `D3ChartLifecycle` (`src/plugins/d3-adapter.tsx`) — already marked `@deprecated`, kept only as a shim for pre-refactor callers. This is a `0.1.0` pre-release with no known shipped runtime consumers yet (per the security report). Worth checking if anything still calls it before 1.0 — if not, delete it rather than carry deprecated API surface into a first stable release.

## Caveat on the graph's own signal

The graph flagged low cohesion scores for "Data Transforms & Container" (0.12) and "Viz Components & Color Scales" (0.10), suggesting these communities could be split up. This isn't really a design smell — those communities are naturally-loose utility collections (five independent transform functions, seven independent chart components), not tightly-coupled modules that got tangled. Not acted on.

---

## Resume point

This review was produced via `/graphify . "what do you think about this code base? grade it. make suggestions on what to improve, change, eliminate."` The graph is already built at `graphify-out/graph.json` (community labels cached in `graphify-out/.graphify_labels.json`... actually cleaned up post-build — rerun `/graphify --cluster-only` or ask a graph question directly, which will reuse `graph.json` via the fast path).

Offered next step (not yet done): trace how `dataAdapter`/`themeAdapter` actually flow through `ViewSwitcher` using the graph, or start writing the `ViewSwitcher` test suggested above.
