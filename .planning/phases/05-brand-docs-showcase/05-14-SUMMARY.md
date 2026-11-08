---
phase: 05-brand-docs-showcase
plan: 14
subsystem: docs-readme
tags: [docs, readme, changelog, contributing]
status: complete

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-04 brand assets; 05-08/05-09 guide, hero snippet and docs; 05-12 chart images; 05-13 chart pages"
provides:
  - "README.md as an 86-line quickstart: banner, tagline, install with pre-release note, verified hero snippet, seven-image chart strip, pipeline diagram, links table"
  - "docs/README.md documentation hub with reading order and a table of every document and folder"
  - "CHANGELOG Unreleased Added and Changed entries for the docs, site and brand work"
  - "CONTRIBUTING section 'Docs, brand and site'"
affects: [05-15]

actuals:
  tokens: 12000
  tasks: 2
  commits: 2
plan_head_before: f47972b27e2b88100df395c359212bbcae1b63cd
plan_head_after: 198f537ef5d2b6fbbad252f74f06df79148fe829
commits: 2

key-files:
  modified:
    - README.md
    - CHANGELOG.md
    - CONTRIBUTING.md
  created:
    - docs/README.md

key-decisions:
  - "The README carries no transform example. The reference content (including the old TransformPipeline example) lives in docs/guide/transforms.md, whose snippet type-checks"

requirements-completed: [D-16, D-17, D-09, D-14, D-02]
---

# Phase 5 Plan 14: README quickstart, docs hub, changelog and contributing Summary

The README shrank from 363 lines to 86: a banner, tagline, install, a quickstart embedded from the type-checked `hero` snippet, a strip of the seven dark chart images, the pipeline diagram and a links table. A docs hub, CHANGELOG entries and a CONTRIBUTING workflow section complete the plan.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 (tracer) | Rewrite README | a40daf8 |
| 2 | Docs hub, CHANGELOG, CONTRIBUTING | 198f537 |

## What changed

- README.md: banner via `brand/banner.svg`, tagline from `brand/tagline.txt`, six verifiable capability bullets, install with the lowercase "pre-release" blockquote beside it (T-05-18 mitigation), `<!-- snippet: hero#hero -->` block copied from `docs/guide/snippets/hero.tsx`, seven distinct `*-dark.png` images in a two-row table, `docs/assets/diagrams/pipeline.svg`, links table (site, guide, API, architecture, USING, PURPOSE, STABILITY, CHANGELOG, CONTRIBUTING), stability sentence and license. No remote images, no badges, no links to individual chart pages.
- docs/README.md: back link, contents, reading order, table of all documents and folders, "Keeping docs in sync".
- CHANGELOG.md: seven Added entries and one Changed entry under Unreleased; the BREAKING entry is untouched.
- CONTRIBUTING.md: "Docs, brand and site" section appended; testing conventions untouched.

## Carry-forward fix: the non-compiling `new TransformPipeline([flatten, ...])` example

The old README example near line 145 was removed with the rest of the manual, so the README no longer contains any `TransformPipeline` example. The compiling equivalent already exists in `docs/guide/snippets/transforms.tsx` (`new TransformPipeline([groupBy('region', 'sales'), joinRegions]).run(flat)`) and is embedded in `docs/guide/transforms.md`. Adding a second transform example to the README would duplicate guide content, which D-16 forbids. No temporary compile check was needed since no new unverified snippet was introduced; the only README code block is the verbatim `hero` region, which `npm run typecheck:site` compiles.

## Verification

- `node scripts/check-docs.mjs` (full): `docs:check OK`, exit 0.
- `scripts/ci.sh`: "local CI passed in 18s" (includes typecheck:site, lint, tests, build, api-extractor, examples build).
- Plan-level checks: README 86 lines (limit 120); 7 distinct dark chart images; banner, pipeline and "pre-release" present; no dead relative targets in README.md, docs/README.md or CONTRIBUTING.md.

## Deviations from Plan

None. The plan was executed as written. The first draft used "Pre-release." capitalised; it was changed to lowercase "pre-release" before the Task 1 commit so the plan's case-sensitive grep passes.

## Known Stubs

None.

## Items for human judgment

- The CHANGELOG and CONTRIBUTING mention the Pages workflow (`.github/workflows` currently holds only `ci.yml`); the workflow is delivered by plan 05-15, so those sentences are ahead of the repo until then.
- The hero quickstart is 17 lines rather than the plan's "about ten"; it is embedded verbatim from the verified snippet.

## Self-Check: PASSED

- FOUND: README.md, docs/README.md, CHANGELOG.md, CONTRIBUTING.md
- FOUND commits a40daf8 and 198f537 (ancestors of HEAD)
- check-docs and scripts/ci.sh both passed before this summary was written
