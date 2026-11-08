---
gsd_state_version: "1.0"
milestone: v1.0
milestone_name: Release readiness
current_phase: 05
current_phase_name: Brand, docs & showcase
current_plan: 13
status: ready
stopped_at: Completed 05-12-PLAN.md
last_updated: "2026-11-08T18:08:28.105Z"
state_head: a925e229936ca4bf37fa061b8706b3984aa91453
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 23
  completed_plans: 19
  percent: 60
---

# Project State

**Core value:** Drop-in, themeable, type-safe data widgets with a pluggable ChartPlugin contract.
**Current focus:** Phase 05 — Brand, docs & showcase

## Current Position

Phase: 05 (Brand, docs & showcase) — EXECUTING
Current Plan: 13
Total Plans in Phase: 16
Phases 01-03 complete. REL-01 (Apache-2.0) done.

## Remaining (Phase 04)

- REL-03: freeze and document public API (next)
- Test-coverage chores (barrels, viz/plugins.ts, pivot/groupBy/geoNormalize, data-table done in 18ffd5a; now 97.8/91.8/94.5):
  - [ ] src/theme/color-scale.ts: branches ~36%, lines 75% (uncovered 23-26, 50, 61-73)
  - [ ] Lower spots: pie-chart branches 83%, container.tsx branches 77%, tree-view funcs 60%, theme/provider.tsx 20-21
- REL-02: npm publish - deferred by owner, do not start until requested

## Decisions (carried forward)

- Identity adapters for native charts via createNativePlugin (01)
- Explicit theme prop instead of useTheme() in viz components (01)
- ResizeObserver only when width/height are CSS strings (01)
- Coverage thresholds just below measured values, scoped to src/** (02)
- examples/ uses root vite with alias to src; excluded from root typecheck (03)
- License is Apache-2.0 (04)
- ForceGraph layout keyed on node ids + edges + seed + iterations; resize never relayouts (04)
- allowScripts pins exact esbuild version so upgrades re-prompt (04)
- CI is local-first: scripts/ci.sh + pre-push hook; minimal hosted backstop (04, 379954d)

## Notes

- Onboarded 2026-11-07 (non-interactive).
- origin/main at 379954d; 5 local commits unpushed (3d20836..312e6ba) as of 2026-11-07.
- Gates (scripts/ci.sh): typecheck, lint, test:coverage, build, examples:build.

## Session Continuity

Last session: 2026-11-08T18:08:28.052Z
Stopped at: Completed 05-12-PLAN.md
Resume file: None

## Performance Metrics

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 4 P04-02 | 10min | 3 tasks | 12 files |
| Phase 4 P04-03 | 10min | 3 tasks | 13 files |
| Phase 4 P04-04 | 5 min | 3 tasks | 12 files |
| Phase 4 P05 | 15min | 4 tasks | 11 files |
| Phase 05 P01 | 10m | 3 tasks | 40 files |
| Phase 05 P02 | 15min | 3 tasks | 7 files |
| Phase 05 P03 | 10 min | 3 tasks | 13 files |
| Phase 05 P04 | 14 min | 3 tasks | 6 files |
| Phase 05 P05-05 | 6 min | 2 tasks | 10 files |
| Phase 05 P06 | 12 min | 2 tasks | 12 files |
| Phase 05 P07 | 8 min | 3 tasks | 17 files |
| Phase 05 P08 | 12 min | 3 tasks | 9 files |
| Phase 05 P09 | 12 min | 3 tasks | 29 files |
| Phase 05 P10 | 12 min | 3 tasks | 24 files |
| Phase 05 P11 | 8 min | 2 tasks | 11 files |
| Phase 05 P12 | 14min | 2 tasks | 33 files |

## Decisions

- [Phase 4]: Choropleth color property resolves valueProperty, valueField, yField, then 'value'
- [Phase 4]: groupBy stays a factory (D-15 option 1); registerPlugin warns on duplicate ids in dev only
- [Phase 4]: Stable adapter factories reference experimental option types by design (D-08/D-09); 04-07 silences incompatible-release-tags
- [Phase 05]: D-01: package renamed to lumagrid with no alias; [lumagrid] warning prefix; historical docs annotated
- [Phase 05]: 05-02: ten devDependencies exact-pinned after user-approved install gate (d3 7.9.2, playwright-core 1.64.1); browser launcher resolves LUMAGRID_CHROME, managed Chromium, system Chrome
- [Phase 05]: 05-03: rect edges (x and x+width) count toward mirror-symmetry sets in the mark geometry test
- [Phase 05]: Docs state the adapter factories do not import d3, recharts or nivo; trust notes limited to grep-confirmed facts
- [Phase 05]: 05-05: unmarked ts/tsx fences under docs/guide fail docs:check; standalone TransformPipeline examples start from TransformedData because flatten is not a PipelineStep
- [Phase 05]: 05-06: brand output allow-list (isAllowedOutput) lives in check-brand.mjs and is shared by the generator and the icons test; app icons use 0.15 padding so the mark sits in the inner 70 percent
- [Phase 05]: 05-07: capture page allow-lists chart/theme/seed and renders a fixed alert for invalid input; TreeView captured inside CollapseManager
- [Phase 05]: 05-08: adapter guide examples import factories from lumagrid/plugins and use fixed-size chart components (BarChart, @nivo/bar Bar) so they render under jsdom
- [Phase 05]: Brand art tagline path serialized locally; opentype toPathData emits NaN at some sizes
- [Phase 05]: 05-10: force and tree demos hold state inside the displayed code region; force graph keyed by seed so a new seed relayouts from scratch
- [Phase 05]: 05-11: grid-bg at z-index 0 with main at z-index 1 (opaque body background would hide a z-index -1 grid)

## Accumulated Context

### Roadmap Evolution

- Phase 5 added (2026-11-07): Brand, docs & showcase — rename VizBox→Lumagrid, user guides, doc refresh, rendered visuals, GitHub Pages showcase, logo and icons.
