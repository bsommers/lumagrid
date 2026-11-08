---
phase: 05-brand-docs-showcase
plan: 11
subsystem: site
tags: [css, neon-grid, reduced-motion, features, links, open-graph]

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-03 brand/tokens.css; 05-07 site shell and og.png; 05-04 diagrams; 05-10 Hero and Gallery CSS awaiting var(--lg-*) tokens"
provides:
  - "site/src/styles/{tokens,base,grid}.css: brand token import, black base styles, compositor-only neon perspective grid with reduced-motion off switch"
  - "Features strip with the pipeline and plugin-architecture diagrams; Links section and footer"
  - "Open Graph, Twitter and canonical metadata with absolute og.png URL"
affects: [05-12, 05-13]

actuals:
  tokens: 14000
  tasks: 2
  commits: 2
plan_head_before: 9216273a56a183c8d2d956c908cff458fe434ec1
plan_head_after: 32ddd2a
commits: 2

tech-stack:
  added: []
  patterns:
    - "Style tests read CSS from disk with node:fs (vitest does not process CSS, and new URL(template, import.meta.url) is rewritten by vite)"
    - "Grid sits at z-index 0 under main at z-index 1 so the opaque body background does not hide it"

key-files:
  created:
    - site/src/styles/tokens.css
    - site/src/styles/base.css
    - site/src/styles/grid.css
    - site/src/sections/features.css
    - site/src/sections/links.css
    - site/src/__tests__/grid.test.ts
    - site/src/__tests__/sections.test.tsx
  modified:
    - site/src/main.tsx
    - site/src/sections/Features.tsx
    - site/src/sections/Links.tsx
    - site/index.html

key-decisions:
  - "Grid background uses z-index 0 with main at z-index 1 (not the research pattern's z-index -1), because an opaque html/body background would paint over a negative-z-index element"
  - "API link is BASE_URL + api/ and carries no target/rel; the four github.com links open in a new tab with rel noopener noreferrer"

requirements-completed: [D-12, D-13, D-07, D-17, D-02, D-11]

duration: 8 min
completed: 2026-11-08
status: complete
---

# Phase 5 Plan 11: Global styles, features and links Summary

Compositor-only CSS neon perspective grid (disabled under prefers-reduced-motion) plus black base styles on the brand tokens, the features strip with both neon diagrams, the links and footer section, and absolute-URL social metadata.

## Accomplishments

- Task 1 (tracer): tokens.css imports brand/tokens.css; grid.css animates only transform and opacity, loops by exactly one cell, drops the cell to 32 px under 600 px and sets `animation: none` on both pseudo-elements under reduced motion; base.css clips horizontal overflow, scrolls `pre` inside its box and gives a cyan focus ring. Built CSS contains the reduced-motion rule and the inlined `--lg-*` tokens, so 05-10's `var(--lg-*, fallback)` rules now resolve.
- Task 2: Features (three blocks, two diagrams with specific alt text, copy checked against docs/ARCHITECTURE.md), Links (user guide, API at `BASE_URL + api/`, architecture, source, changelog; Apache-2.0 and pre-release footer), index.html description (tagline plus clause), canonical, Open Graph and Twitter tags with `https://bsommers.github.io/lumagrid/og.png`.

## Verification

- `npx vitest run site/src/__tests__`: 91 passed (7 grid, 7 sections).
- `npm run typecheck:site`, `npm run site:build`, `npx eslint site/src --max-warnings 0`: clean; `grep -lq prefers-reduced-motion site/dist/assets/*.css` and `grep og:image site/dist/index.html` succeed.
- Grep gate: no innerHTML, dangerouslySetInnerHTML or font CDN URL in site/src or site/index.html.
- Human checks (preview at desktop and 375 px, OS reduced-motion) not run; the real 375 px scrollWidth check belongs to plan 05-12.

## Deviations from Plan

**1. [Rule 1 - Bug] Grid z-index** - Found during: Task 1. The research pattern uses `z-index: -1`, but html and body have an opaque background, which would paint over a negative-z-index fixed element and hide the grid. Fix: `.grid-bg` at z-index 0, `main` position relative at z-index 1. Files: grid.css, base.css. Commit 21a4eb0.

**2. [Rule 3 - Blocking] CSS tests read from disk** - Found during: Task 1. `?raw` CSS imports return empty in vitest and a templated `new URL(..., import.meta.url)` is rewritten by vite; used `readFileSync` with `dirname(fileURLToPath(import.meta.url))`. File: grid.test.ts. Commit 21a4eb0.

**Total deviations:** 2 auto-fixed. **Impact:** none on scope.

## Known Stubs

None.

## Threat Flags

None. T-05-14 mitigations enforced by tests (noopener noreferrer on external anchors; no external url or @import in the three style files).

## Commits

- 21a4eb0 feat(05-11): neon grid background, base styles and brand token import
- 32ddd2a feat(05-11): features strip, links and footer, social metadata

## Next

Ready for 05-12 (real 375 px overflow check and capture) / next plan in wave.

## Self-Check: PASSED
