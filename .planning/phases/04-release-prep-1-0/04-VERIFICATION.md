---
phase: 04-release-prep-1-0
verified: 2026-11-07T00:00:00Z
status: passed
score: 28/28 must-haves verified
covered_files:
  - .planning/phases/04-release-prep-1-0/04-01-PLAN.md
  - .planning/phases/04-release-prep-1-0/04-01-SUMMARY.md
  - .planning/phases/04-release-prep-1-0/04-02-PLAN.md
  - .planning/phases/04-release-prep-1-0/04-02-SUMMARY.md
  - .planning/phases/04-release-prep-1-0/04-03-PLAN.md
  - .planning/phases/04-release-prep-1-0/04-03-SUMMARY.md
  - .planning/phases/04-release-prep-1-0/04-04-PLAN.md
  - .planning/phases/04-release-prep-1-0/04-04-SUMMARY.md
  - .planning/phases/04-release-prep-1-0/04-05-PLAN.md
  - .planning/phases/04-release-prep-1-0/04-05-SUMMARY.md
  - .planning/phases/04-release-prep-1-0/04-06-PLAN.md
  - .planning/phases/04-release-prep-1-0/04-06-SUMMARY.md
  - .planning/phases/04-release-prep-1-0/04-07-PLAN.md
  - .planning/phases/04-release-prep-1-0/04-07-SUMMARY.md
  - CHANGELOG.md
  - docs/STABILITY.md
  - etc/api-extractor.base.json
  - etc/vizbox-plugins.api.md
  - etc/vizbox-theme.api.md
  - etc/vizbox-transforms.api.md
  - etc/vizbox-viz.api.md
  - etc/vizbox.api.md
  - package.json
  - scripts/api.sh
  - scripts/ci.sh
  - src/registry/index.ts
  - src/registry/native-plugin.tsx
  - src/registry/types.ts
  - src/transforms/group-by.ts
  - src/viz/choropleth.tsx
  - src/viz/force-graph.tsx
  - src/viz/horizontal-bar-chart.tsx
  - src/viz/line-chart.tsx
  - src/viz/pie-chart.tsx
covered_digest: "v3:sha256:e3fc351b13a02d76f313484d2595896fd3640187017e6f3cb1a4a7e3f715d7b2"
behavior_unverified: 0
overrides_applied: 0
deferred:
  - truth: "REL-02: Published to npm"
    addressed_in: "Deferred by owner (not in a later roadmap phase)"
    evidence: "04-CONTEXT.md: out of scope, do not start until owner asks"
---

# Phase 4: Release prep (1.0) Verification Report

**Phase Goal:** Apache-2.0 relicense (done, 6660dda), npm publish (deferred), API freeze.
**Status:** passed (REL-03 achieved; REL-01 done pre-phase; REL-02 deferred by owner)
**Re-verification:** No

## Requirements Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| REL-01 | SATISFIED (pre-phase, 6660dda) | REQUIREMENTS.md checked |
| REL-02 | DEFERRED (owner decision, not a gap) | REQUIREMENTS.md unchecked; 04-CONTEXT.md out-of-scope |
| REL-03 | SATISFIED | Truths below; REQUIREMENTS.md checked |

No orphaned IDs: REL-01..03 all mapped to phase 04 and all accounted for.

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Role-named props (valueField/labelField/idField/colorField) on NativeChartProps, xField/yField @deprecated, index signature kept | VERIFIED | `native-plugin.tsx` lines 18-34 |
| 2 | Per-chart alias mapping (D-02) with role name winning | VERIFIED | bar: `valueField ?? xField`; line: `valueField ?? yField`, `labelField ?? xField`; pie: `valueField ?? yField`; force-graph: `idField ?? xField`, `labelField ?? yField`; choropleth: `valueProperty ?? valueField ?? yField ?? 'value'` |
| 3 | No runtime warning for aliases; deprecation in TSDoc + CHANGELOG | VERIFIED | CHANGELOG Deprecated section with exact D-02 mapping |
| 4 | registerPlugin warns on duplicate outside production, process-undefined safe, overwrites, returns id | VERIFIED | `src/registry/index.ts` lines 20-32 (see WR-01/02 below) |
| 5 | registerAndGetId @deprecated; no public reset/unregister | VERIFIED | `etc/vizbox.api.md` line 402 only; no `__reset` in any report; `@internal` in source |
| 6 | groupBy typed as factory signature (D-15) | VERIFIED | `group-by.ts:31` |
| 7 | Every export tagged @public or @beta+@experimental; untagged = error | VERIFIED | `ae-missing-release-tag: error` in base config; `api:check` exits 0 for all five entries; parity check in `scripts/api.sh` |
| 8 | Five API reports committed under etc/; `api:check` wired into scripts/ci.sh | VERIFIED | five `etc/vizbox*.api.md`; `ci.sh:37` |
| 9 | typedoc docs:api generates to git-ignored docs/api | VERIFIED | `git check-ignore docs/api` matches; `docs/api` exists |
| 10 | CHANGELOG.md Keep a Changelog with Unreleased backfill + Deprecated | VERIFIED | file read |
| 11 | docs/STABILITY.md: tag promises, stable/experimental lists, registry semantics/test convention, guard description | VERIFIED | file read |
| 12 | README Stability section; RELEASE-PLAN points to STABILITY and no longer says `component`; CONTRIBUTING documents api:check/update; examples use role names | VERIFIED | README:359, RELEASE-PLAN:22, CONTRIBUTING:30, examples/src/main.tsx:43 |
| 13 | Root exports every type in root signatures (no unexported-type warnings) | VERIFIED | api-extractor check completes successfully with unexported-type errors enabled |
| 14 | Coverage thresholds unchanged; `bash scripts/ci.sh` passes | VERIFIED | ran: "local CI passed in 11s", exit 0 (typecheck, lint, tests+coverage, build, 5x api check, examples build); working tree unchanged afterwards |

(Per-plan truths for 04-01..04-07 collapse into the rows above; all verified.)

## Probe / Gate Execution

| Check | Command | Result | Status |
| --- | --- | --- | --- |
| Project gate | `bash scripts/ci.sh` | exit 0 | PASS |

## Human Verification

None required.

## Advisory Items (04-REVIEW.md, none blocking, all open per 04-REVIEW-DISPOSITION.md)

- WR-01: duplicate warning silent in browser bundles because of `typeof process` guard (D-05 as written is satisfied; behavior weaker than intent).
- WR-02: warning fires on re-registering the identical plugin object.
- WR-03: standalone `api:check`/`api:update` can read stale `dist/esm`; `ci.sh` builds first so the gate is sound.
- WR-04: `ae-incompatible-release-tags` is `none` for all entries (base config), weakening the gate beyond plugins (confirmed at `etc/api-extractor.base.json:56`).
- IN-01..03: prefix `[uitoolbox]` (deferred to Phase 5 rename), unanchored `temp/`, awk parity misfire.

## Anti-Patterns

No unreferenced TBD/FIXME/XXX blockers in the covered implementation files.

---

_Verified: 2026-11-07_
_Verifier: Claude (gsd-verifier)_
