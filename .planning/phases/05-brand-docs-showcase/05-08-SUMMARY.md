---
phase: 05-brand-docs-showcase
plan: 08
subsystem: docs
tags: [docs, guide, plugins, adapters, d3, recharts, nivo, troubleshooting]

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-02 pinned d3, recharts, @nivo/bar; 05-05 check-docs.mjs and guide snippets project"
provides:
  - "docs/guide/plugins-and-adapters.md: ChartPlugin contract, registry semantics, seven native ids, custom plugin, D3/Recharts/Nivo adapters with experimental-type note"
  - "docs/guide/troubleshooting.md: ten Symptom/Cause/Fix entries confirmed against src"
  - "docs/guide/README.md: guide index with reading order and links to the four docs/ pages"
  - "Compiled and rendered snippets: custom-plugin, adapters-d3, adapters-recharts, adapters-nivo"
affects: [05-13]

actuals:
  tokens: 21000
  tasks: 3
  commits: 3
plan_head_before: b9992a8a125e3d71f789fea4085671dffed8b011
plan_head_after: 55f751e94d22b87e5a969409e1cd975f8940dfa5
commits: 3

tech-stack:
  added: []
  patterns: ["adapter snippets use fixed-size chart components (BarChart, Bar from @nivo/bar) so they render under jsdom", "D3 snippet builds SVG with select/join/attr/text only"]

key-files:
  created:
    - docs/guide/README.md
    - docs/guide/plugins-and-adapters.md
    - docs/guide/troubleshooting.md
    - docs/guide/snippets/custom-plugin.tsx
    - docs/guide/snippets/adapters-d3.tsx
    - docs/guide/snippets/adapters-recharts.tsx
    - docs/guide/snippets/adapters-nivo.tsx
    - docs/guide/snippets/__tests__/plugins.test.tsx
    - docs/guide/snippets/__tests__/adapters.test.tsx
  modified: []

key-decisions:
  - "Adapter examples import factories from lumagrid/plugins (the real entry point); no README snippet was copied"
  - "Nivo row type is a type alias, not an interface, to satisfy BarDatum's index signature (found by the compiler)"

patterns-established:
  - "Every guide code block is a snippet region; pages are assembled by expanding region markers so fences are byte-identical"

requirements-completed: [D-16, D-18]

coverage:
  - id: D1
    description: "Plugin contract, registry semantics and a custom plugin documented with compiled, rendered code"
    requirement: "D-16"
    verification:
      - kind: unit
        ref: "docs/guide/snippets/__tests__/plugins.test.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "D3, Recharts and Nivo adapters documented with compiling, rendering examples and experimental-type note"
    requirement: "D-18"
    verification:
      - kind: unit
        ref: "docs/guide/snippets/__tests__/adapters.test.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: "Troubleshooting page and guide index; full docs checker green"
    requirement: "D-16"
    verification:
      - kind: other
        ref: "node scripts/check-docs.mjs"
        status: pass
    human_judgment: true
    rationale: "Prose accuracy of each troubleshooting entry was checked against source by the author; no test asserts the wording"

status: complete
---

# Phase 5 Plan 08: Plugins, adapters, troubleshooting and guide index Summary

The non-chart guide chapters are done: a plugin and adapter chapter whose D3, Recharts and Nivo examples compile and render, a ten-entry troubleshooting page grounded in the source, and the guide index; the full `check-docs` run now exits 0.

## Accomplishments

- **Task 1 (tracer, 8244ad4):** `custom-plugin.tsx` defines a typed `ChartPlugin<Bar[], BarTheme, BarConfig>` (data adapter, theme adapter, `Renderer`), registers it and renders it through `ViewSwitcher`; render test plus the first half of `plugins-and-adapters.md` (contract, registry, seven native ids, custom plugin).
- **Task 2 (af40cff):** three adapter snippets and a three-case render test. D3 asserts three `rect` elements; Recharts asserts `svg.recharts-surface` and bar rectangles; Nivo asserts an svg. The Adapters section has a factory table, per-adapter subsections, and the stability note (factories stable, config/theme types experimental).
- **Task 3 (55f751e):** `troubleshooting.md` (10 entries) and `docs/guide/README.md`. Full `node scripts/check-docs.mjs` passes, including the previously flagged missing link targets.

## Verification

- `node scripts/check-docs.mjs`: OK
- `npx vitest run docs/guide`: 3 files, 9 tests pass
- `npx tsc -p docs/guide/snippets/tsconfig.json --noEmit`: clean
- `npx eslint docs/guide/snippets --max-warnings 0`: clean
- Negative grep for `innerHTML|dangerouslySetInnerHTML|.html(` in snippets: no matches (T-05-11)

## Source-confirmed facts used in troubleshooting

- Unregistered id message and duplicate-registration `[lumagrid]` warning text (src/core/view-switcher.tsx, src/registry/index.ts).
- ForceGraph reads rows with a non-null `source` as edges and silently skips edges whose endpoints are not node ids.
- Choropleth placeholder appears without `projectedPaths`.
- A CSS-string size in a jsdom test throws `ReferenceError: ResizeObserver is not defined` (probed by a throwaway test, then removed).
- `moduleResolution: node` fails to resolve `lumagrid/viz`; `bundler` works (probed against the built dist with a scratch project outside the repo).
- `TreeView` throws `useCollapse must be used inside a CollapseManager`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Nivo rows typed as interface failed to compile**
- **Found during:** Task 2
- **Issue:** `interface Row` is not assignable to Nivo's `BarDatum` (missing index signature).
- **Fix:** use a `type` alias with a comment explaining why.
- **Files modified:** docs/guide/snippets/adapters-nivo.tsx
- **Commit:** af40cff

**2. [Plan wording] Troubleshooting zero-size entry**
- The plan implied zero-size containers in jsdom; probing showed rendering actually throws because `ResizeObserver` is undefined, so the entry documents both the blank-chart and the thrown-error cases.

**Total deviations:** 1 auto-fixed (bug), 1 clarification. **Impact:** none on scope.

## Known Stubs

None.

## Threat Flags

None. No new endpoints or trust boundaries; T-05-11 mitigated (D3 snippet uses append/attr/text only, grep gate passes). T-05-SC: no packages installed.

## Self-Check: PASSED

All created files exist; commits 8244ad4, af40cff, 55f751e are on main.
