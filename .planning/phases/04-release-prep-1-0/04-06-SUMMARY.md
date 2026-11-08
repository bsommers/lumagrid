---
phase: 04-release-prep-1-0
plan: 06
subsystem: docs
tags: [changelog, stability, api, readme, release-plan, contributing, examples]
requires: ["04-01", "04-02", "04-03", "04-04"]
provides:
  - "CHANGELOG Unreleased backfill with a Deprecated section (xField/yField per chart, registerAndGetId)"
  - "docs/STABILITY.md: tag promises, stable and experimental lists, field props, registry semantics, test convention, API guard"
  - "README Stability section, field props table, experimental label on ForceGraph options, fixed WidgetContainer snippet"
  - "RELEASE-PLAN corrected (Renderer, not component) and pointed at STABILITY.md; CONTRIBUTING duplicate-id and api:update notes"
  - "examples sales views (bar, line, pie) pass valueField and labelField through config"
affects: [04-07]
tech-stack:
  added: []
  patterns: ["CHANGELOG entries cite short commit hashes from git log; no invented entries"]
key-files:
  created:
    - docs/STABILITY.md
  modified:
    - CHANGELOG.md
    - README.md
    - docs/RELEASE-PLAN.md
    - CONTRIBUTING.md
    - examples/src/main.tsx
decisions:
  - "Unreleased keeps the D-13 backfill items (relicense, NaN and pie fixes, examples app, ESLint, coverage thresholds) even though their commits predate 41892a8, the commit that records the 0.1.0 status"
  - "CHANGELOG omits committed API reports, the scripts/ci.sh api gate and the root type exports; plan 04-07 delivers those and they are added there"
  - "STABILITY.md and CONTRIBUTING.md describe the ci.sh api:check gate and the strict untagged-export check as the phase end state; they become true when 04-07 lands"
  - "Work committed on phase/04-06-release-docs, not main (see Deviations)"
requirements-completed: []
status: complete
actuals:
  tokens: 7774
  tasks: 3
  commits: 3
plan_head_before: 445c03c63109a11fc703a002b72f45055d01bb11
plan_head_after: bbdbe90fa35f655f276986b1398c6ca7d9fb3b6d
commits: 3
---

# Phase 04 Plan 06: Changelog, stability policy and docs migration Summary

The documentation half of REL-03 is written against the code as it stands after 04-01 to 04-05: a backfilled CHANGELOG with every deprecation, a stability policy in `docs/STABILITY.md`, README and RELEASE-PLAN corrections, and the examples app using the role-named props. REL-03 stays open until 04-07 lands the committed reports and the `ci.sh` gate.

## What was done

- Task 1 (267cf4f): CHANGELOG `Unreleased` has Added, Changed, Deprecated and Fixed sections. Each entry cites a commit hash from `git log`. Deprecated lists `xField`/`yField` per chart (HorizontalBarChart, LineChart, PieChart, ForceGraph, Choropleth) and `registerAndGetId`, with removal in 2.0. The 0.1.0 baseline section is unchanged.
- Task 2 (f077363): `docs/STABILITY.md` covers tag promises, the D-08 stable list, the D-09 experimental list, the field-prop table and per-chart legacy mapping, registry semantics, the registry test convention, transform option handling, and the API guard. README gained a Stability section, a field props table, an "Experimental" label on the ForceGraph options, and a `WidgetContainer` snippet that calls `groupBy` instead of `aggregate` as a function. RELEASE-PLAN now says the renderer field is `Renderer`, its stability list is replaced by a pointer to STABILITY.md, and done items are struck through. CONTRIBUTING describes duplicate ids as a warn-and-replace and adds an `api:update` note under Local CI.
- Task 3 (bbdbe90): the bar, line and pie views in `examples/src/main.tsx` share `config: { valueField: 'revenue', labelField: 'region' }`. Data, layout and registration are unchanged.

## Fact checks against src/

Every claim was checked with `git grep` or by reading source before it was written:

- Field resolution per chart (`valueField ?? xField ?? inferred`, and the chart-specific mapping) matches `horizontal-bar-chart.tsx`, `line-chart.tsx`, `pie-chart.tsx`, `force-graph.tsx` (`idField ?? xField ?? 'id'`, `labelField ?? yField ?? 'label'`) and `choropleth.tsx` (`valueProperty ?? valueField ?? yField ?? 'value'`).
- `colorField` is read only by LineChart among the native charts.
- ForceGraph `relayout` (default `true`), `seed` (default `1`) and `iterations` (default `60`) match `force-graph.tsx`.
- Experimental tags: 9 adapter declarations in the plugins modules, plus `relayout`, `seed`, `iterations` and `projectedPaths`. The lists in STABILITY.md match `git grep "@experimental"`.
- Registry: `registerPlugin` returns the id, warns only when `process` exists and `NODE_ENV !== 'production'`, and replaces. `__resetRegistryForTests` is `@internal` and appears in no barrel.
- Transforms: `aggregate`, `pivot` and `geoNormalize` return the input unchanged when `options` is undefined, and `groupBy` is a factory. `TransformPipeline.run` never passes per-step options.
- `typedoc.json` excludes `@beta`. `.gitignore` contains `docs/api/`.
- Commit hashes in the CHANGELOG were checked against `git log` subjects and `git show --stat`. Two are described more precisely than the plan's wording: the NaN and pie guards come from f6eef36, and the Choropleth tooltip change from b765864 (its diff touches only `choropleth.tsx` and tests).

## Verification

- `npm run --silent examples:build`: exit 0.
- Final gate `npm run --silent typecheck && npm run --silent lint && npx vitest run`: exit 0. 22 files, 217 tests pass.
- Plan grep checks for CHANGELOG, STABILITY, README, RELEASE-PLAN, CONTRIBUTING and examples: all pass.

## Deviations from Plan

**1. [Process] Commits on `phase/04-06-release-docs`, not `main`**
- **Found during:** the pre-commit HEAD assertion (commit protocol step 0).
- **Issue:** the protected-branch guard reports `main` as protected (`git.base-branch --is-protected` returns `true`). The sequential instruction asked for commits on main, but the guard halts commits to a protected branch. Its override is `git.allow_default_branch_commits` in `.planning/config.json`, which is dirty and off-limits, so I did not touch it.
- **Fix:** the guard's own remedy is "re-home onto a phase branch". I ran `git switch -c phase/04-06-release-docs` from 445c03c. The working tree was kept, the guard passed on the new branch, and the three task commits are there. `main` is untouched. The orchestrator must merge this branch into main, for example with `git merge --ff-only phase/04-06-release-docs`, once the owner has reviewed it.

**2. [Scope] CHANGELOG omits three items from the plan**
- **Found during:** Task 1 accuracy check.
- **Issue:** committed API reports, the `api:check` gate in `scripts/ci.sh`, and the package-root type exports do not exist yet. Plan 04-07 creates them.
- **Fix:** left out of the CHANGELOG. 04-07 should add them when it lands.

**3. [Forward dependency] Docs describe the end state of 04-07**
- STABILITY.md says `scripts/ci.sh` runs `api:check` and that an untagged export fails the check. CONTRIBUTING.md says `ci.sh` fails until the reports match. Both are true only after 04-07. Until then, `ci.sh` has no API step and no `etc/` reports exist.

## Known Stubs

None.

## Threat Flags

None. The CHANGELOG and STABILITY text cites commit subjects and short hashes only. It has no author names, emails, `.planning/` paths or internal URLs (T-04-13).

## Self-Check: PASSED

- Files: `CHANGELOG.md`, `docs/STABILITY.md`, `README.md`, `docs/RELEASE-PLAN.md`, `CONTRIBUTING.md`, `examples/src/main.tsx` all exist and are committed on `phase/04-06-release-docs`.
- Commits `267cf4f`, `f077363`, `bbdbe90` are ancestors of HEAD.
- REL-03 is left open, as instructed.
