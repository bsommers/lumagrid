---
phase: 04-release-prep-1-0
plan: 02
subsystem: viz
tags: [api, deprecation, tsdoc, release-tags, line-chart, pie-chart, force-graph, choropleth]
requires: ["04-01"]
provides:
  - role-named field props honoured by LineChart, PieChart, ForceGraph, Choropleth
  - "@public tags on all 18 stable viz exports"
  - "@beta + @experimental tags on ForceGraph relayout/seed/iterations and Choropleth projectedPaths"
affects: [04-03, 04-04, 04-06]
tech-stack:
  added: []
  patterns: [role name then legacy alias then inference; no runtime deprecation warning]
key-files:
  created: []
  modified:
    - src/viz/line-chart.tsx
    - src/viz/pie-chart.tsx
    - src/viz/force-graph.tsx
    - src/viz/choropleth.tsx
    - src/viz/data-table.tsx
    - src/viz/tree-view.tsx
    - src/viz/plugins.ts
    - src/viz/types.ts
    - src/viz/__tests__/line-chart.test.tsx
    - src/viz/__tests__/pie-chart.test.tsx
    - src/viz/__tests__/force-graph.test.tsx
    - src/viz/__tests__/choropleth.test.tsx
decisions:
  - "Choropleth color property resolves valueProperty, valueField, yField, then 'value'"
  - "VisualizationProps stays unexported, aligned with NativeChartProps and marked internal"
status: complete
actuals:
  tokens: 9000
  tasks: 3
  commits: 3
plan_head_before: 7b04c94d0967d0893abbf0989686376c3c7f9e4e
plan_head_after: 132c0856c486e998a7f3f0c6fdf48e0c52362319
---

# Phase 04 Plan 02: Role-based fields across native charts and viz release tags Summary

LineChart, PieChart, ForceGraph and Choropleth now resolve columns from role-named props first, then the D-02 legacy `xField`/`yField` aliases, then inference; every viz export carries its stability tag.

## What was done

- LineChart: `valueField ?? yField ?? first number`, `labelField ?? xField ?? first string/date`.
- PieChart: same idiom; local constants renamed `valueKey`/`labelKey` to avoid shadowing the new props; `PieChartProps` documented.
- ForceGraph: `idField ?? xField ?? 'id'`, `labelField ?? yField ?? 'label'` (locals renamed `idKey`/`labelKey`); `relayout`, `seed`, `iterations` dual-tagged beta + experimental.
- Choropleth: `valueProperty ?? valueField ?? yField ?? 'value'`; `projectedPaths` dual-tagged.
- DataTable, TreeView, TreeViewProps and the seven `native*Plugin` presets tagged public (18 total with the earlier components); `VisualizationProps` gained `valueField`/`idField`, deprecated aliases, and is marked internal (still unexported).
- Tests: role names, aliases, precedence and inference for each chart (211 tests total pass).

## Verification

`npm run typecheck`, `npm run lint` and `npx vitest run` pass; coverage run stays above the unchanged thresholds (97.93 / 91.92 / 94.52 / 97.93). Tag counts: 18 public in src/viz tsx and plugins.ts; force-graph 3 beta + 3 experimental; choropleth 1 + 1.

## Deviations from Plan

None - plan executed exactly as written. Tasks 1 and 2 were verified together with the full suite rather than per-task targeted commands (sequential executor).

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

All 12 modified files exist; commits e332b78, 4e0c621 and 132c085 are ancestors of HEAD.
