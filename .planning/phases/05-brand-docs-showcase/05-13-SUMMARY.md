---
phase: 05-brand-docs-showcase
plan: 13
subsystem: docs-guide
tags: [docs, charts, snippets, guide]

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-12 docs/assets/charts images; 05-08/05-09 guide pages and the snippet harness"
provides:
  - "docs/guide/charts/: index plus one reference page per native chart"
  - "seven verified snippet files (docs/guide/snippets/chart-*.tsx) and a render test"
  - "guide index and getting-started link the chart pages"
affects: [05-14]

actuals:
  tokens: 40000
  tasks: 3
  commits: 3
plan_head_before: 935cf7ca63e0358e24084171f2f87acad1e7d94e
plan_head_after: c2b713ceaa0923dd35396c6be7e36953b6984a5f
commits: 3

key-files:
  created:
    - docs/guide/charts/README.md
    - docs/guide/charts/bar-chart.md
    - docs/guide/charts/line-chart.md
    - docs/guide/charts/pie-chart.md
    - docs/guide/charts/force-graph.md
    - docs/guide/charts/choropleth.md
    - docs/guide/charts/data-table.md
    - docs/guide/charts/tree-view.md
    - docs/guide/snippets/chart-bar.tsx
    - docs/guide/snippets/chart-line.tsx
    - docs/guide/snippets/chart-pie.tsx
    - docs/guide/snippets/chart-force.tsx
    - docs/guide/snippets/chart-choropleth.tsx
    - docs/guide/snippets/chart-table.tsx
    - docs/guide/snippets/chart-tree.tsx
    - docs/guide/snippets/__tests__/charts.test.tsx
  modified:
    - docs/guide/README.md
    - docs/guide/getting-started.md

key-decisions:
  - "Each chart page has two snippet regions: the component drawn directly with an explicit theme prop, and the equivalent ViewSwitcher view config"
  - "DataTable and TreeView pages state PNG only and why; they also state the keyboard accessibility gaps found in the source"

requirements-completed: [D-16, D-14]

duration: 20 min
completed: 2026-11-08
status: complete
---

# Phase 5 Plan 13: Chart reference pages Summary

Seven chart reference pages and an index, each with role-named props confirmed against src, a type-checked and rendered snippet, and the committed light and dark images.

## Accomplishments

- Tracer: bar chart page, snippet and render test proving the template (commit 55d4387).
- Line, pie and data table pages (feb7e6b).
- Force graph, choropleth and tree view pages, the charts index, and links from docs/guide/README.md and getting-started.md (c2b713c).
- All claims were read from the component source: ForceGraph treats rows with a non-null `source` as edges; Choropleth `valueProperty` wins over `valueField`, `projectedPaths` is required to draw a map and the placeholder text is quoted; TreeView needs a CollapseManager and `onSelect` fires on every row click; DataTable pages 25 rows and sorts by header click.
- The render test asserts the Choropleth placeholder when `projectedPaths` is absent and that TreeView reports a selected node.

## Verification

- `bash scripts/ci.sh`: passed (local CI passed in 18s).
- `node scripts/check-docs.mjs`: `docs:check OK`.
- `npx vitest run docs/guide`: 16 tests passed (7 in charts.test.tsx).
- `npx tsc -p docs/guide/snippets/tsconfig.json --noEmit` and `npx eslint docs/guide/snippets --max-warnings 0`: clean.
- `xField` appears 6 times across the chart pages (one deprecation sentence on each page that has the alias; the table and index have none).

## Deviations from Plan

None - plan executed as written. The README `TransformPipeline` example named in the carry-forward note belongs to README.md, which this plan does not own; it was not touched here (plan 05-14).

## Known Stubs

None.

## Threat Flags

None. All images on the chart pages are relative paths into docs/assets; check-docs proves they exist and none is remote (T-05-17).

## Self-Check: PASSED

- All 16 created files exist; the two modified guide files carry the chart links.
- Commits 55d4387, feb7e6b and c2b713c are ancestors of HEAD.
- scripts/ci.sh and scripts/check-docs.mjs exit 0.
