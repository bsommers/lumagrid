---
gsd_state_version: "1.0"
milestone: v1.0
milestone_name: Release readiness
current_phase: 4
status: ready
stopped_at: Phase 4 complete — all phases complete
last_updated: "2026-11-08T01:04:15.058Z"
state_head: 4862043e63b6efdb0ee0c1696cd3fc48a4b27b8a
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 7
  completed_plans: 7
  percent: 75
---

# Project State

**Core value:** Drop-in, themeable, type-safe data widgets with a pluggable ChartPlugin contract.
**Current focus:** Phase 4 — Release prep (1.0)

## Current Position

Phase: 4
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

Last session: 2026-11-08T01:00:21.125Z
Stopped at: Phase 4 complete — all phases complete
Resume file: None

## Performance Metrics

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 4 P04-02 | 10min | 3 tasks | 12 files |
| Phase 4 P04-03 | 10min | 3 tasks | 13 files |
| Phase 4 P04-04 | 5 min | 3 tasks | 12 files |
| Phase 4 P05 | 15min | 4 tasks | 11 files |

## Decisions

- [Phase 4]: Choropleth color property resolves valueProperty, valueField, yField, then 'value'
- [Phase 4]: groupBy stays a factory (D-15 option 1); registerPlugin warns on duplicate ids in dev only
- [Phase 4]: Stable adapter factories reference experimental option types by design (D-08/D-09); 04-07 silences incompatible-release-tags
