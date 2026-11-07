---
phase: 04-release-prep-1-0
plan: 01
subsystem: viz
tags: [api, deprecation, tsdoc, changelog, bar-chart]
requires: []
provides:
  - role-named field props on NativeChartProps (valueField, labelField, idField, colorField)
  - xField/yField @deprecated alias pattern
  - "@public TSDoc tag convention"
  - CHANGELOG.md skeleton with first Deprecated entry
affects: [04-02, 04-03, 04-04, 04-06]
tech-stack:
  added: []
  patterns: [role name then legacy alias then inference; no runtime deprecation warning]
key-files:
  created: [CHANGELOG.md]
  modified:
    - src/registry/native-plugin.tsx
    - src/viz/horizontal-bar-chart.tsx
    - src/viz/__tests__/horizontal-bar-chart.test.tsx
decisions:
  - "Role name wins over legacy alias; deprecation lives in TSDoc and CHANGELOG only"
status: complete
actuals:
  tokens: 6000
  tasks: 1
  commits: 1
plan_head_before: 59867656283d0114e9850ffe4427def9a179535a
plan_head_after: 45dab131deebed04753b08af2db2050384e6d851
---

# Phase 04 Plan 01: Role-based fields on HorizontalBarChart Summary

Role-named field props (`valueField`/`labelField`/`idField`) with `xField`/`yField` kept as `@deprecated` aliases, proven end to end on HorizontalBarChart including the `nativeBarPlugin` path, plus the first CHANGELOG Deprecated entry.

## What was done

- `NativeChartProps`: added `valueField`, `idField`; documented `labelField`/`colorField` roles; `xField`/`yField` marked `@deprecated` (removal in 2.0); index signature kept; `@public` tag.
- `HorizontalBarChart`: resolves `valueField ?? xField ?? inferred number` and `labelField ?? yField ?? inferred string` into `valueKey`/`labelKey`; `@public` TSDoc; no runtime warning.
- Tests: field selection, legacy aliases, role-name precedence, inference fallback, and a `nativeBarPlugin.Renderer` config test.
- `CHANGELOG.md`: Keep a Changelog skeleton, Unreleased Added/Deprecated entries, 0.1.0 baseline line.

## Verification

`bash scripts/ci.sh` passed (typecheck, lint, tests under unchanged 97/97/91/94 thresholds, build, examples build); greps for `valueField`, `@deprecated`, `@public` matched.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

CHANGELOG.md found; commit 45dab13 is an ancestor of HEAD.
