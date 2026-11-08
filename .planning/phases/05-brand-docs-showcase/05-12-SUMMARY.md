---
phase: 05-brand-docs-showcase
plan: 12
subsystem: docs-visuals
tags: [visuals, headless-browser, png, svg, determinism, layout-assertions]

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-02 scripts/lib/browser.mjs; 05-07 site/capture.html and capture.tsx; 05-10/05-11 landing page and neon grid"
provides:
  - "npm run visuals: build, preview on 127.0.0.1, capture 14 PNG and 10 SVG, assert landing page layout in a real browser"
  - "npm run visuals:check and docs/__tests__/visuals.test.ts: browser-free validation of the committed images"
  - "docs/assets/charts/ with README"
affects: [05-13, 05-14]

actuals:
  tokens: 30000
  tasks: 2
  commits: 2
plan_head_before: deaf0399f221a054372ed08e1c70af8480e9d35b
plan_head_after: a925e229936ca4bf37fa061b8706b3984aa91453
commits: 2

tech-stack:
  added: []
  patterns:
    - "One shared matrix module (charts, themes, SVG-capable subset, sizes) imported by render and check scripts"
    - "Capture page aliases Inter via @font-face so the themes' 'Inter' family never falls back to a system font"
    - "SVG extraction through XMLSerializer on a clone with an inserted background rect"

key-files:
  created:
    - scripts/lib/visuals-matrix.mjs
    - scripts/render-visuals.mjs
    - scripts/check-visuals.mjs
    - site/src/capture.css
    - docs/__tests__/visuals.test.ts
    - docs/assets/charts/README.md
    - "docs/assets/charts/*.png (14)"
    - "docs/assets/charts/*.svg (10)"
  modified:
    - site/src/capture.tsx

key-decisions:
  - "Chart images are committed and regenerated on demand; scripts/ci.sh neither runs the renderer nor mentions the headless-browser tool (D-15)"
  - "Site layout assertions (375 and 1280 px scrollWidth, grid animation under reduced motion) live in the render script, not the CI gate (D-13)"

requirements-completed: [D-14, D-15, D-19, D-13, D-10]

duration: 14 min
completed: 2026-11-08
status: complete
---

# Phase 5 Plan 12: Chart images and real-browser layout checks Summary

Deterministic renderer that screenshots all seven native charts in light and dark (14 PNG, 1280 x 800) and extracts self-contained SVGs for the five SVG charts (10), plus real-browser assertions that the landing page does not overflow at 375 or 1280 px and that the neon grid animates only when motion is allowed.

## Accomplishments

- Task 1 (tracer): matrix module, `capture.css` Inter alias, `render-visuals.mjs` (Vite JS API build, preview bound to 127.0.0.1, non-local requests aborted, browser sandbox on), `check-visuals.mjs`; bar-dark PNG and SVG captured, validated and byte-identical on a second run.
- Task 2: full run of the matrix; site checks pass (scrollWidth 375 <= 375 and 1280 <= 1280; grid animation `none` under reduced motion, `grid-scroll` otherwise); two full regenerations produce byte-identical files; folder README; `docs/__tests__/visuals.test.ts` (3 tests, no browser).

## Verification

- `node scripts/render-visuals.mjs && node scripts/check-visuals.mjs`: exit 0. Second regeneration (`--no-build --no-site-checks`): all 24 files byte-identical.
- `npx vitest run docs/__tests__/visuals.test.ts brand/__tests__/svg-safety.test.ts`: 112 passed (svg-safety covers the 10 new SVGs automatically).
- `npm run typecheck:site` and `npx eslint scripts/*visuals* scripts/lib/visuals-matrix.mjs site/src --max-warnings 0`: clean.
- `bash scripts/ci.sh`: passed (local CI passed in 20s). `grep -qi playwright scripts/ci.sh` finds nothing.
- Visual check: bar-dark, line-dark, pie-light, force-light, choropleth-dark, table-light, tree-dark viewed; Inter text, correct data, nothing clipped.

## Deviations from Plan

**1. [Rule 1 - Bug] Plugin ids in the folder README** - Found during: Task 2. The plan asked for a plugin id column; the real ids come from `src/viz/plugins.ts` and only differ for the force graph (`force-graph`, not `force`). README uses the real id. File: docs/assets/charts/README.md. Commit a925e22.

**2. [Rule 3 - Blocking] Lint globals** - The in-page `page.evaluate` callbacks use browser globals that eslint flags in a Node script; added a `/* global ... */` directive and removed a dead initial assignment. File: scripts/render-visuals.mjs. Commit 33b2821.

**3. Process note** - The plan commit ledger file (`gsd-plan-head-before-05-12`) was not created before the first commit; `plan_head_before` was taken from the parent of the first task commit (deaf039) and the count verified with `git rev-list --count deaf039..HEAD` = 2.

**Total deviations:** 2 auto-fixed, 1 process note. **Impact:** none on scope.

## Observations (not changed, out of scope)

- Library demo output: the line chart x axis omits the Mar tick label and the charts have no legends. These come from the library components, not this plan.
- Choropleth renders unlabeled hex cells (demo geometry).

## Known Stubs

None.

## Threat Flags

None. T-05-15 mitigated (127.0.0.1 only, sandbox on, non-local requests aborted); T-05-16 mitigated (check-visuals rejects script and foreignObject; svg-safety test passes on all extracted SVGs).

## Self-Check: PASSED

- FOUND: scripts/lib/visuals-matrix.mjs, scripts/render-visuals.mjs, scripts/check-visuals.mjs, site/src/capture.css, docs/__tests__/visuals.test.ts, docs/assets/charts/README.md, 14 PNG and 10 SVG in docs/assets/charts
- FOUND commits: 33b2821, a925e22
