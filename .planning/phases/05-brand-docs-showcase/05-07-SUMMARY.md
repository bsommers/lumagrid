---
phase: 05-brand-docs-showcase
plan: 07
subsystem: site
tags: [vite, react, capture, fontsource, ci]

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-02 pinned deps and vitest alias; 05-03 brand/contrast.ts; 05-05 guide snippets project; 05-06 site/public icons and manifest"
provides:
  - "examples/shared/demos.ts: single home of demo data and role-field configs for all seven native charts"
  - "site/ Vite app (base /lumagrid/, source aliases) building index.html and capture.html"
  - "Allow-listed capture page for bar, line, pie, force, choropleth, table, tree with data-capture-ready signal"
  - "Four-section shell with stub components and self-hosted fonts"
  - "scripts/ci.sh typecheck:site step"
affects: [05-08, 05-09, 05-10, 05-11, visuals, pages]

actuals:
  tokens: 26000
  tasks: 3
  commits: 3
plan_head_before: ed3e1bc62bd5849a6f114cfbfe8a22cf88fbe3e6
plan_head_after: b947eb88bb4ecea611f1ff8a7b704269b7f59dda
commits: 3

tech-stack:
  added: []
  patterns: ["capture page: allow-list parse, fixed 640x400 box, ready attribute via React state after fonts.ready + rAF", "hex tile map projected by a deterministic generator (Choropleth has no projection engine)"]

key-files:
  created:
    - examples/shared/demos.ts
    - site/vite.config.ts
    - site/tsconfig.json
    - site/capture.html
    - site/index.html
    - site/src/capture.tsx
    - site/src/main.tsx
    - site/src/App.tsx
    - site/src/sections/Hero.tsx
    - site/src/sections/Features.tsx
    - site/src/sections/Gallery.tsx
    - site/src/sections/Links.tsx
    - site/src/__tests__/capture.test.tsx
    - site/src/__tests__/shell.test.tsx
  modified:
    - examples/src/main.tsx
    - scripts/ci.sh
    - brand/contrast.ts

key-decisions:
  - "demoViews entries carry both data and an explicit role-field config type (not NativeConfig, whose Omit collapses to the index signature)"
  - "Tree capture wraps TreeView in CollapseManager with the root expanded, since TreeView requires that context"
  - "Invalid capture parameters render a fixed alert and never echo input; seed limited to 1-9 digits"

patterns-established:
  - "Site and examples share data through examples/shared; site tsconfig includes it plus brand/contrast.ts"

requirements-completed: [D-10, D-12, D-14, D-15, D-21, D-08]

coverage:
  - id: D1
    description: "Shared demos used by examples and site; examples build unchanged"
    requirement: "D-10"
    verification:
      - kind: other
        ref: "npm run examples:build; grep const sales examples/src/main.tsx finds nothing"
        status: pass
    human_judgment: false
  - id: D2
    description: "Capture page renders seven charts x two themes deterministically with allow-listed parameters"
    requirement: "D-14"
    verification:
      - kind: unit
        ref: "site/src/__tests__/capture.test.tsx (32 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Site shell with four anchors, self-hosted woff2 fonts, two-page build under /lumagrid/"
    requirement: "D-12"
    verification:
      - kind: unit
        ref: "site/src/__tests__/shell.test.tsx"
        status: pass
      - kind: other
        ref: "npm run site:build emits index.html, capture.html and woff2 assets"
        status: pass
    human_judgment: false
  - id: D4
    description: "ci.sh gains only the site typecheck step"
    requirement: "D-21"
    verification:
      - kind: other
        ref: "bash scripts/ci.sh --fast (passes in 8s); grep checks for playwright and site:build absent"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-08
status: complete
---

# Phase 5 Plan 07: Site Workspace, Capture Page and Shell Summary

**Vite site app aliased to library source with a deterministic, allow-listed capture page for all seven native charts, a four-section shell with self-hosted fonts, and a site typecheck step in the local gate.**

## Accomplishments

- `examples/shared/demos.ts` now holds sales, trend, network (12 nodes, 16 edges), hexMap with `hexProjectedPaths`, tableRows and `demoViews`; `examples/src/main.tsx` imports from it and its build is unchanged.
- `site/` builds `index.html` and `capture.html` under base `/lumagrid/`; capture is noindex, 640 by 400, themed from the library themes, and sets `data-capture-ready="1"` after fonts and one animation frame.
- Capture tests: 7 charts x 2 themes, force layout identical for equal seeds and different for different seeds, 12 choropleth paths, 13 invalid-input cases that render only the fixed alert.
- Shell with stub Hero, Features, Gallery, Links sections; Orbitron, Inter and JetBrains Mono emitted as woff2 files into `site/dist/assets`.
- `scripts/ci.sh` has exactly one new step (`typecheck:site`).

## Task Commits

1. Task 1 (tracer): `f328c7d` feat(05-07): site workspace with shared demos, bar capture page and site typecheck gate
2. Task 2: `f8c6ebf` feat(05-07): capture page and shared demos for all seven native charts
3. Task 3: `b947eb8` feat(05-07): site shell with four stub sections, self-hosted fonts and index entry

Tracer feedback gate: verify re-run end to end after Task 1 (typecheck:site, capture test, examples:build, site:build, guards) passed before expansion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Strict index typing in brand/contrast.ts**
- **Found during:** Task 1
- **Issue:** The site tsconfig includes `../brand/contrast.ts`, which failed `noUncheckedIndexedAccess` (`out[m[1]] = m[2].trim()`), so `typecheck:site` could not pass.
- **Fix:** Destructure the match and guard undefined before assigning; behavior unchanged (brand tests pass).
- **Files modified:** brand/contrast.ts
- **Commit:** f328c7d

**2. [Rule 3 - Blocking] TreeView needs a CollapseManager**
- **Found during:** Task 2
- **Issue:** TreeView throws without the context that ViewSwitcher normally supplies.
- **Fix:** Capture wraps it in `CollapseManager defaultExpanded={['all']}`.
- **Files modified:** site/src/capture.tsx
- **Commit:** f8c6ebf

**Total deviations:** 2 auto-fixed (2 blocking). **Impact:** none on scope.

## Known Stubs

Hero, Features, Gallery and Links in `site/src/sections/*.tsx` are intentional placeholders (heading only); plans 05-10 (Hero, Gallery) and 05-11 (Features, Links) replace them.

## Threat Flags

None. T-05-09 and T-05-10 mitigated as planned (allow-lists with fixed alert; `fs.allow` limited to repo root, host unset).

## Self-Check: PASSED

All created files exist; commits f328c7d, f8c6ebf, b947eb8 are ancestors of HEAD; `bash scripts/ci.sh --fast`, `npm run lint`, `npm run site:build`, `npm run examples:build` pass.
