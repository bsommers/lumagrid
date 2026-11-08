---
phase: 04-release-prep-1-0
plan: 07
subsystem: api-gate
tags: [api-extractor, typedoc, ci, api-reports, release-tags]
requires: ["04-02", "04-03", "04-04", "04-05", "04-06"]
provides:
  - "Self-contained root barrel: PieChartProps, ChoroplethProps, ForceGraphProps, TreeViewProps, D3PluginOptions, NivoPluginOptions, RechartsRow, PipelineStep, AnyTransform"
  - "Strict api-extractor: ae-missing-release-tag and ae-forgotten-export are errors for ., /transforms, /theme; release tag error for /viz and /plugins"
  - "Five committed API reports in etc/"
  - "scripts/ci.sh api report step (api:check) after build"
  - "typedoc treatWarningsAsErrors"
affects: []
tech-stack:
  added: []
  patterns: ["api-extractor child configs deep-merge messages with the base, so /viz and /plugins override only ae-forgotten-export"]
key-files:
  created:
    - etc/vizbox.api.md
    - etc/vizbox-transforms.api.md
    - etc/vizbox-theme.api.md
    - etc/vizbox-viz.api.md
    - etc/vizbox-plugins.api.md
  modified:
    - src/index.ts
    - etc/api-extractor.base.json
    - etc/api-extractor.viz.json
    - etc/api-extractor.plugins.json
    - typedoc.json
    - scripts/ci.sh
    - CHANGELOG.md
    - .planning/REQUIREMENTS.md
decisions:
  - "ae-incompatible-release-tags set to none in the base config: the stable adapter factories intentionally take experimental option and theme shapes (D-08/D-09 split)"
  - "/viz and /plugins keep ae-forgotten-export at none with addToApiReportFile true; they reference shared types consumers import from the root"
requirements-completed: [REL-03]
status: complete
actuals:
  tokens: 6000
  tasks: 3
  commits: 4
plan_head_before: 94a1381eaab5cb6008f41653eedc8b656da2d579
plan_head_after: b753e6cbcfa9c88d07a4c89d9c4f5b43e8ac710c
commits: 4
---

# Phase 4 Plan 07: API gate Summary

The API freeze is now machine-checked: strict api-extractor, five committed reports in `etc/`, `api:check` in `scripts/ci.sh`, and a typedoc that fails on warnings.

## Tasks

1. Root barrel and strict configs: a306847. `api:update` was clean on the first run; no export needed re-tagging. The incompatible-release-tags mismatch appeared as expected and was set to `none` in the base config (the one permitted exception).
2. Reports: 31fc451. Generated, not hand-edited.
3. ci.sh: c755439.
4. CHANGELOG entries (carry-over from 04-06): b753e6c.

## Report review (D-08/D-09)

Export lines per report: root 76, transforms 21, theme 15, viz 18, plugins 12.
- Plugins: nine D-09 declarations marked beta (seven shapes, two theme adapters); three adapter factories public.
- Viz: four beta members (ForceGraph `relayout`, `seed`, `iterations`; Choropleth `projectedPaths`).
- Root: `registerAndGetId` is `@public @deprecated`; `NativeChartProps.xField` and `yField` deprecated.
- `__resetRegistryForTests` appears in no report. Root, transforms and theme reports contain no warnings.
- Re-tagged exports: none.

## Gate proof

1. Added an optional parameter to `listPlugins`: `bash scripts/ci.sh` exited 1 at the api report step with "You have changed the API signature for this project". Reverted with `git checkout`.
2. Replaced `@public` on `categoricalColor` with an unknown tag: exit 1 at the api report step with `ae-missing-release-tag`. Reverted.
3. Restored tree: `bash scripts/ci.sh` exit 0 (22 files, 217 tests, coverage thresholds unchanged, build, api report, examples build).

## Deviations from Plan

- [Rule 2] CHANGELOG Unreleased gained the three carry-over items from 04-06 (reports, ci gate, root type exports).
- REL-03: `requirements.mark-complete` returned not_found; marked by hand in `.planning/REQUIREMENTS.md`.
- Docs (STABILITY.md, CONTRIBUTING.md) already matched the delivered behaviour; no change.
- Work committed on main (no branch guard blocked it).

## Known Stubs

None.

## Self-Check: PASSED
