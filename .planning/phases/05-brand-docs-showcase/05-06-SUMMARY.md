---
phase: 05-brand-docs-showcase
plan: 06
subsystem: brand
tags: [favicon, ico, webmanifest, playwright-core, png, vitest]

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-02 scripts/lib/browser.mjs launcher and npm brand scripts; 05-03 mark.svg and favicon.svg sources"
provides:
  - "brand/assets.json declarative manifest of every generated brand output"
  - "scripts/build-brand.mjs manifest-driven SVG to PNG, ICO and webmanifest generator (npm run brand)"
  - "scripts/check-brand.mjs checkBrand validator (PNG IHDR, ICO directory, web manifest)"
  - "site/public favicon.svg, favicon.ico, favicon-16/32.png, apple-touch-icon.png, icon-192/512.png, site.webmanifest"
affects: [05-09, 05-07, 05-08]

actuals:
  tokens: 14000
  tasks: 2
  commits: 2
plan_head_before: e4d881930fce749e038108e5d2f27968fdd41ec6
plan_head_after: 10f4f1c140841c8c985dcfe44c23d71d4a653056
commits: 2

tech-stack:
  added: []
  patterns: ["manifest-driven generator with path allow-list", "dependency-free PNG-in-ICO writer", "validator shared by CLI and vitest, reads committed files only"]

key-files:
  created: [brand/assets.json, scripts/build-brand.mjs, scripts/check-brand.mjs, brand/__tests__/icons.test.ts, site/public/favicon.svg, site/public/favicon.ico, site/public/favicon-16.png, site/public/favicon-32.png, site/public/apple-touch-icon.png, site/public/icon-192.png, site/public/icon-512.png, site/public/site.webmanifest]
  modified: []

key-decisions:
  - "The path allow-list (isAllowedOutput, manifestOutputs) lives in check-brand.mjs and is imported by build-brand.mjs, so generator and test enforce one definition"
  - "favicon.svg stroke widths left unchanged after the 16 px review: the center node and the rising line are distinguishable"
  - "App icons use padding 0.15 per side so the 64-unit viewBox occupies the inner 70 percent; the web manifest content lives in brand/assets.json and is written by the generator"

requirements-completed: [D-09, D-06]

coverage:
  - id: D1
    description: "npm run brand generates favicon and app-icon PNGs, a 16+32 ICO, favicon.svg copy and site.webmanifest, byte-deterministically, writing only inside site/public/ and docs/assets/"
    requirement: "D-09"
    verification:
      - kind: unit
        ref: "brand/__tests__/icons.test.ts"
        status: pass
      - kind: other
        ref: "node scripts/check-brand.mjs; two builds with identical sha256"
        status: pass
    human_judgment: false
  - id: D2
    description: "Favicon center node and rising line are distinguishable at 16 px"
    requirement: "D-06"
    human_judgment: true
    rationale: "Viewed favicon-16.png at 1x and 8x nearest-neighbour: a bright cyan node with a lighter diagonal line reaching both corners reads clearly; a human should confirm at real browser-tab size"

duration: 12min
completed: 2026-11-08
status: complete
---

# Phase 5 Plan 06: Brand Icons Summary

**Manifest-driven brand build: browser-rasterized favicon and app-icon PNGs, a dependency-free PNG-in-ICO writer and a generated web manifest, validated by one checker shared by the CLI and a browser-free vitest test.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 2 (Task 1 was a tracer; its verify was re-run, including the byte-identical double build and the ImageMagick ICO cross-check, before expansion)
- **Files created:** 12

## Accomplishments
- brand/assets.json lists 5 PNGs (16, 32, 180, 192, 512), the ICO, the favicon.svg copy and the web manifest; the schema is documented in the header of build-brand.mjs.
- build-brand.mjs launches the browser once through launchBrowser, aborts every network request, renders each SVG at deviceScaleFactor 1 and refuses any output outside site/public/ and docs/assets/. Two consecutive builds are byte-identical (sha256 over all PNGs, ICO and manifest).
- favicon.ico holds exactly two PNG frames (16x16 and 32x32), confirmed by `magick identify` and by the checker's directory parse.
- check-brand.mjs validates PNG signature and IHDR sizes, the ICO directory and each embedded image, copies, and the web manifest (parses, relative start_url and scope, every icon src exists with matching size).
- icons.test.ts (6 tests) runs inside scripts/ci.sh without a browser; brand/ suite is 5 files, 92 tests, all passing, and svg-safety now covers site/public/favicon.svg.
- App icons are opaque (`%[opaque]` True) on #05070A with the mark in the inner 70 percent.

## 16 px legibility review (D-06)
Viewed site/public/favicon-16.png directly and at 8x nearest-neighbour. The bright cyan center node and the lighter rising line are both distinguishable; the lattice lines soften to faint stubs as the research assumed. No stroke-width change was made, so favicon.svg stays as committed in 05-03 (lattice 4, rising line 8, node r 12). Judgment is by the executor's image view; a human glance at real tab size is still worthwhile.

## Task Commits

1. **Task 1: favicon end to end (manifest, generator, validator, test)** - `08b08d5` (feat)
2. **Task 2: app icons and web manifest** - `10f4f1c` (feat)

## Deviations from Plan

None - plan executed exactly as written. Interpretation notes: the web manifest `description` reuses brand/tagline.txt wording ("Themeable, pluggable data widgets for React"); the `site/` directory did not exist yet, so the generator creates site/public/ on first run.

## Issues Encountered
None. `bash scripts/ci.sh` was not run (the orchestrator runs it after the wave); targeted vitest on brand/, eslint on the new scripts and test are clean.

## Authentication Gates
None.

## Known Stubs
None.

## Threat Flags
None. T-05-08 mitigations are in place: path allow-list enforced in the generator and asserted in the test, all network requests aborted while rasterizing, sandbox left on.

## User Setup Required
None.

## Next Phase Readiness
Plan 05-09 can extend brand/assets.json with the social card, OG image, banner and chart icons: add `pngs` entries (and a `padding` where needed) and rerun `npm run brand`. Site plans can reference the icons via relative paths under site/public/.

## Self-Check: PASSED
