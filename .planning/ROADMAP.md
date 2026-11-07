# Roadmap: VizBox

## Milestone v1.0 - Release readiness

- [x] **Phase 01: Plugin architecture** - ChartPlugin registry, adapters, ResizeObserver, tests (complete; commit da94f7a + follow-ups)
- [ ] **Phase 02: Viz robustness + test completion** - IN PROGRESS (being executed by another agent)
- [ ] **Phase 03: Examples app + ESLint**
- [ ] **Phase 04: Release prep (1.0)**

### Phase 01: Plugin architecture
**Status**: Complete. 16/16 tasks (.planning/phases/01-plugin-architecture).

### Phase 02: Viz robustness + test completion
**Goal**: Fix NaN handling in line-chart; add tests for pie, tree, force, choropleth; enforce coverage threshold.
**Requirements**: ROB-01, TEST-01, TEST-02
**Source**: .planning/codebase-review-2026-08-05.md, test-suite-qa-review-2026-08-09.md
**Plans**: TBD (execution underway outside GSD plan files)

### Phase 03: Examples app + ESLint
**Goal**: Runnable examples app; ESLint configured and passing.
**Requirements**: EX-01, LINT-01
**Depends on**: Phase 02

### Phase 04: Release prep (1.0)
**Goal**: Apache-2.0 relicense (in progress), npm publish, API freeze.
**Requirements**: REL-01, REL-02, REL-03
**Depends on**: Phase 03
