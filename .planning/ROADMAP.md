# Roadmap: VizBox

## Milestone v1.0 - Release readiness

- [x] **Phase 01: Plugin architecture** - ChartPlugin registry, adapters, ResizeObserver, tests (complete; commit da94f7a + follow-ups)
- [x] **Phase 02: Viz robustness + test completion** (complete 2026-11-07)
- [x] **Phase 03: Examples app + ESLint** (complete 2026-11-07)
- [ ] **Phase 04: Release prep (1.0)**

### Phase 01: Plugin architecture
**Status**: Complete. 16/16 tasks (.planning/phases/01-plugin-architecture).

### Phase 02: Viz robustness + test completion
**Goal**: Fix NaN handling in line-chart; add tests for pie, tree, force, choropleth; enforce coverage threshold.
**Requirements**: ROB-01, TEST-01, TEST-02
**Source**: .planning/codebase-review-2026-08-05.md, test-suite-qa-review-2026-08-09.md
**Status**: Complete 2026-11-07 (executed outside GSD plan files). Commits f6eef36, b765864, 9f74aee, 33ebf1b. 139 tests; coverage gate lines/stmts 80, branches 83, funcs 79.

### Phase 03: Examples app + ESLint
**Goal**: Runnable examples app; ESLint configured and passing.
**Requirements**: EX-01, LINT-01
**Status**: Complete 2026-11-07. Commits cf089dc (examples/, `npm run examples:build`), a6aaa35 (flat ESLint, `npm run lint`).
**Depends on**: Phase 02

### Phase 04: Release prep (1.0)
**Goal**: Apache-2.0 relicense (done, 6660dda), npm publish, API freeze. See docs/RELEASE-PLAN.md.
**Requirements**: REL-01, REL-02, REL-03
**Depends on**: Phase 03
