---
phase: 05-brand-docs-showcase
plan: 09
subsystem: brand
tags: [svg, brand-art, social-preview, open-graph, banner, chart-icons, opentype, vitest]
status: complete

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-03 lockup.svg, wordmark.svg, tagline.txt and tokens.css; 05-06 manifest-driven build-brand.mjs and check-brand.mjs"
provides:
  - "scripts/brand/compose.mjs deterministic composer for social, OG and banner SVGs"
  - "brand/social.svg (1280x640), brand/og.svg (1200x630), brand/banner.svg (1280x320)"
  - "seven 64x64 neon chart icons brand/icons/chart-*.svg, one per native plugin id"
  - "generated PNGs: docs/assets/social-preview.png, docs/assets/banner.png, site/public/og.png, docs/assets/chart-icons/chart-*.png (128 px)"
affects: [05-07, 05-10, 05-11]

actuals:
  tokens: 52000
  tasks: 3
  commits: 3
plan_head_before: f666b593d6aa73e312ce4f3381c3901c19e4bf92
plan_head_after: e19b144256be9007991b2b87bdb39e50df0f4bf4
commits: 3

tech-stack:
  added: []
  patterns: ["layout-table composer that embeds the lockup verbatim and outlines the tagline from tagline.txt", "art test compares committed SVG to freshly composed output (drift gate)", "icon set pinned to native plugin ids by test"]

key-files:
  created: [scripts/brand/compose.mjs, brand/social.svg, brand/og.svg, brand/banner.svg, brand/icons/chart-bar.svg, brand/icons/chart-line.svg, brand/icons/chart-pie.svg, brand/icons/chart-force-graph.svg, brand/icons/chart-choropleth.svg, brand/icons/chart-table.svg, brand/icons/chart-tree.svg, brand/__tests__/art.test.ts, docs/assets/social-preview.png, docs/assets/banner.png, site/public/og.png, docs/assets/chart-icons/]
  modified: [brand/assets.json, package.json]

key-decisions:
  - "Art contains exactly two paths: the canonical wordmark path (from lockup.svg) and an outlined tagline path; the grid is plain line elements, glow is a radial gradient, banner fade is a mask"
  - "Tagline path data is serialized locally from opentype commands because Path.toPathData() in opentype.js 2.0.0 emits NaN for some size and glyph combinations"
  - "npm run brand now runs compose.mjs before build-brand.mjs so one command regenerates SVG and PNG outputs"

requirements-completed: [D-09, D-06, D-07, D-08]

coverage:
  - deliverable: "Social card, OG image and README banner composed from the canonical lockup with outlined tagline"
    verification:
      - {kind: test, ref: "brand/__tests__/art.test.ts", status: pass}
      - {kind: command, ref: "node scripts/check-brand.mjs", status: pass}
    human_judgment: false
  - deliverable: "Seven chart-type neon icons matching the native plugin ids"
    verification:
      - {kind: test, ref: "brand/__tests__/art.test.ts#chart icons", status: pass}
      - {kind: command, ref: "node scripts/check-brand.mjs", status: pass}
    human_judgment: false
  - deliverable: "Visual quality and recognizability of the art and icons"
    human_judgment: true
    rationale: "Aesthetics were reviewed by the executor from rendered PNGs; no test asserts them"
---

# Phase 5 Plan 09: Brand Art Summary

**Deterministic composer producing the social card, Open Graph image and README banner from the canonical lockup plus an outlined Orbitron tagline, with seven neon chart icons and all PNGs generated through the brand manifest.**

## Accomplishments

- `scripts/brand/compose.mjs` embeds `brand/lockup.svg` verbatim, outlines `brand/tagline.txt` with Orbitron 500 and draws a perspective neon grid (radiating lines, quadratic row spacing, stroke opacity 0.12 to 0.35), a horizon glow and a black to `#05070A` gradient. No text, font-family or style elements.
- `brand/social.svg` (1280x640), `brand/og.svg` (1200x630, content inside the central safe area) and `brand/banner.svg` (1280x320, left aligned with the grid fading in from the left via a mask).
- Seven 64x64 icons on a 4-unit integer grid (bar, line, pie, force-graph, choropleth, table, tree), cyan strokes with light cyan highlights and at most one magenta element each, plus 128 px transparent PNGs.
- `brand/__tests__/art.test.ts` (table driven): viewBox, embedded wordmark path, one tagline path, forbidden constructs, palette-only colors, tagline contrast at or above 4.5:1, no NaN, grid opacity range, committed SVG equals fresh composer output, icon geometry is integer within 0 to 64, icon file set equals the plugin ids from `src/viz/plugins.ts`.
- Two consecutive `npm run brand` runs are byte-identical (sha256 over all SVG and PNG outputs).

## Task Commits

1. Task 1 (tracer): social card composer, SVG, PNG, art test and `npm run brand` wiring - `12ffaa4`
2. Task 2: OG image and README banner, plus NaN fix - `0d9771a`
3. Task 3: seven chart icons and PNGs - `e19b144`

## Deviations from Plan

**1. [Rule 1 - Bug] opentype.js `toPathData()` emitted NaN in the tagline path**
- **Found during:** Task 2 (OG image rendered a truncated tagline at 24 px; also reproduced at 18 and 20 px)
- **Fix:** serialize the path commands locally in `compose.mjs` (`pathData`); added a NaN/Infinity assertion to the art test. `social.svg` was regenerated (shorter numbers, same geometry).
- **Files modified:** scripts/brand/compose.mjs, brand/social.svg, docs/assets/social-preview.png, brand/__tests__/art.test.ts
- **Commit:** 0d9771a

**2. [Rule 3 - Blocking] `npm run brand` did not regenerate SVG sources**
- The plan requires two consecutive `npm run brand` runs to be byte-identical and the SVGs to be regenerated by it; `package.json` `brand` script only ran `build-brand.mjs`. Changed to `node scripts/brand/compose.mjs && node scripts/build-brand.mjs` (package.json was not in the plan's file list).
- **Commit:** 12ffaa4

**3. Composer does not `process.chdir`**: it resolves paths from the repo root so `composeArt` can be imported inside vitest workers (chdir is unsupported there).

**Total deviations:** 2 auto-fixed, 1 note. **Impact:** none on scope.

## Known Stubs

None.

## Threat Flags

None. No new network, auth or file-access surface; T-05-12 mitigations hold (manifest-driven PNGs validated by check-brand, deterministic composer, svg-safety test scans every new SVG).

## Verification

- `node scripts/brand/compose.mjs && node scripts/build-brand.mjs && node scripts/check-brand.mjs` pass (check-brand: OK).
- `npx vitest run brand/__tests__`: 6 files, 233 tests pass.
- `npx eslint scripts/brand/compose.mjs brand/__tests__ --max-warnings 0` clean.
- 7 icon SVGs and 7 icon PNGs exist; regeneration changes no bytes.
- `scripts/ci.sh` left to the orchestrator per plan.

## Self-Check: PASSED

All created files exist on disk and commits 12ffaa4, 0d9771a, e19b144 are on HEAD.
