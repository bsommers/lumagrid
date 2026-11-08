---
phase: 05-brand-docs-showcase
plan: 05
subsystem: docs
tags: [docs, guide, snippets, check-docs, vitest, tsc]

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-02 vitest alias for lumagrid specifiers, shared scripts and docs:check / typecheck:site npm scripts; 05-04 architecture docs"
provides:
  - "scripts/check-docs.mjs (npm run docs:check): names, historical, links, images and snippets checks with --only and --root"
  - "docs/guide/snippets project: strict tsconfig, three snippet sources, render and result tests"
  - "docs/guide/getting-started.md, transforms.md, theming.md with verbatim, compiled, rendered code"
affects: [05-08, 05-13, 05-14]

actuals:
  tokens: 14500
  tasks: 2
  commits: 2
plan_head_before: 30843431c411052caffc1f50a7058b29561af3d3
plan_head_after: 01a727abd87b191c7dfa58411b9aa778b43c23d9
commits: 2

tech-stack:
  added: []
  patterns:
    - "single-source guide code: .tsx region -> verbatim markdown block -> checker -> tsc -> vitest render"
    - "docs checker exports checkDocs({root, files, only}) and is unit-tested with temp-dir fixtures"

key-files:
  created:
    - scripts/check-docs.mjs
    - scripts/__tests__/check-docs.test.ts
    - docs/guide/snippets/tsconfig.json
    - docs/guide/snippets/quickstart.tsx
    - docs/guide/snippets/transforms.tsx
    - docs/guide/snippets/theming.tsx
    - docs/guide/snippets/__tests__/snippets.test.tsx
    - docs/guide/getting-started.md
    - docs/guide/transforms.md
    - docs/guide/theming.md
  modified: []

key-decisions:
  - "Unmarked ts/tsx/js/jsx fenced blocks under docs/guide/ are a snippets-check error; bash, json and text blocks are exempt, so install commands and result data stay inline"
  - "Standalone TransformPipeline example starts from TransformedData because flatten is not assignable to PipelineStep; WidgetContainer's transforms prop accepts it"
  - "The names check scans every tracked or untracked-unignored text file outside the historical allowlist, including the checker and its test"

requirements-completed: [D-16, D-04, D-20, D-01, D-03]

coverage:
  - id: D1
    description: "scripts/check-docs.mjs with five checks and a negative-probe unit test (one error per kind, clean fixture, only filter)"
    requirement: "D-16"
    verification:
      - kind: unit
        ref: "scripts/__tests__/check-docs.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Snippet project compiles under strict root settings and every Example renders a chart"
    requirement: "D-16"
    verification:
      - kind: unit
        ref: "docs/guide/snippets/__tests__/snippets.test.tsx"
        status: pass
      - kind: other
        ref: "npx tsc -p docs/guide/snippets/tsconfig.json --noEmit"
        status: pass
    human_judgment: false
  - id: D3
    description: "getting-started, transforms and theming chapters embed their snippets verbatim and name no former product name"
    requirement: "D-01"
    verification:
      - kind: other
        ref: "node scripts/check-docs.mjs --only names,historical,snippets"
        status: pass
    human_judgment: true
    rationale: "Prose accuracy was checked against src and unit tests by the author; readability and completeness need a human read"
---

# Phase 5 Plan 05: Docs checker, snippet pipeline and first three guide chapters Summary

**Single-source guide pipeline: snippet `.tsx` regions embedded verbatim in markdown, enforced by `scripts/check-docs.mjs`, compiled by tsc and rendered by vitest, plus the getting-started, transforms and theming chapters built on it.**

## Performance

- **Tasks:** 2 of 2 (Task 1 tracer, Task 2 auto)
- **Files:** 10 created, none modified
- **Commits:** 2 task commits

## Accomplishments

- `scripts/check-docs.mjs` checks the former names against an allowlist, historical notes on the nine historical files, relative links and images (including traversal and root-relative links), remote images, and snippet blocks against their regions. File list comes from `git ls-files` via `execFileSync` with an argument array (T-05-07); link targets are only existence-checked and a path outside the repo root is an error.
- `scripts/__tests__/check-docs.test.ts` proves all five error kinds from one bad fixture, a clean pass, the `only` filter, the historical rule, snippet edge cases and root-relative links.
- `docs/guide/snippets` compiles under the root strict settings (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) and its tests render all three `Example` components and assert the result values the chapters state (aggregated bars, pivot, groupBy, geoNormalize, color helper outputs).
- Three chapters: getting-started (install, first chart, data model, role field names, plugin ids), transforms (all five transforms with worked results from the real unit tests, pipeline semantics), theming (providers, token groups, color helpers).

## Task Commits

1. **Task 1: checker, snippet pipeline, getting-started** - `faf6936` (feat)
2. **Task 2: transforms and theming chapters** - `01a727a` (docs)

## Verification

- `npx vitest run scripts/__tests__/check-docs.test.ts docs/guide/snippets/__tests__/snippets.test.tsx` passes (13 tests); full suite passes (30 files, 333 tests).
- `npx tsc -p docs/guide/snippets/tsconfig.json --noEmit` exits 0.
- `node scripts/check-docs.mjs --only names,historical,snippets` prints `docs:check OK`.
- `npx eslint . --max-warnings 0` (npm run lint) passes.
- Per-chapter back link, snippet marker and transform/helper coverage greps pass.
- Full `node scripts/check-docs.mjs` (links) reports only targets owned by later plans: `guide/README.md`, `guide/troubleshooting.md`, `guide/plugins-and-adapters.md` (05-08 and 05-13), as the plan expects.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, found in docs] README's `new TransformPipeline([flatten, ...])` does not type-check**
- **Found during:** Task 2 (compiling the transforms snippet)
- **Issue:** `TransformPipeline` takes `PipelineStep[]` (`transform(data: TransformedData)`), but `flatten` takes `unknown[]`, so TS2322. The README's pipeline example and the tests (which are not type-checked) hide this. `WidgetContainer`'s `transforms` prop does accept `flatten`.
- **Fix:** The guide's standalone `TransformPipeline` example starts from `TransformedData` (output of `flatten.transform`), and transforms.md explains the typing consequence. No source change (that would alter a public API and the API reports).
- **Files modified:** docs/guide/snippets/transforms.tsx, docs/guide/transforms.md
- **Follow-up for 05-13:** the README transform-pipeline example still shows the non-compiling form and should be replaced by a guide snippet or link.

**2. [Rule 2 - Missing critical] Unmarked code blocks in guide chapters are an error**
- **Found during:** Task 1 (acceptance criterion "every fenced code block in the three chapters is preceded by a snippet marker")
- **Issue:** The plan lists the criterion but not how the checker enforces it, while chapters legitimately contain bash and JSON blocks.
- **Fix:** The snippets check flags unmarked ts, tsx, js and jsx fences in `docs/guide/*.md`; bash and json blocks are exempt. Covered by a unit test.
- **Files modified:** scripts/check-docs.mjs, scripts/__tests__/check-docs.test.ts

**Total deviations:** 2 auto-fixed (1 bug found in docs, 1 missing enforcement). **Impact:** none on scope; one README follow-up for 05-13.

## Issues Encountered

- `npm run typecheck:site` fails at its first command (`site/tsconfig.json` does not exist yet; the site is built by a later plan). The snippet half of that script, `tsc -p docs/guide/snippets/tsconfig.json --noEmit`, passes on its own.

## Known Stubs

None.

## Threat Flags

None. The checker adds no network surface; T-05-07 mitigations (argument-array git call, root containment, existence-only link checks, traversal fixture) are implemented and tested.

## Next Phase Readiness

Plan 05-08 adds `plugins-and-adapters.md` and `troubleshooting.md`; once they and `guide/README.md` exist, full `npm run docs:check` should go green. Chapters 05-08 and 05-13 can reuse the snippet conventions (`// #region name`, `<!-- snippet: file#region -->`).

## Self-Check: PASSED

All ten created files exist; commits `faf6936` and `01a727a` are ancestors of HEAD.
