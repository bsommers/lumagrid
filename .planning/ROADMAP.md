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
**Plans:** 1/7 plans executed (REL-03 only; REL-01 done, REL-02 deferred by owner)

Plans:
**Wave 1**
- [x] 04-01-PLAN.md — Wave 1 tracer: role-based fields end to end on HorizontalBarChart, `@public`/`@deprecated` convention, CHANGELOG seed

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 04-02-PLAN.md — Wave 2: role names + aliases on LineChart/PieChart/ForceGraph/Choropleth, tags on all viz exports
- [ ] 04-03-PLAN.md — Wave 2: registry semantics (duplicate-id warn, returned id, deprecated `registerAndGetId`), `groupBy` factory type, tags on registry + transforms
- [ ] 04-04-PLAN.md — Wave 2: tags on theme, core and plugin-adapter layers (`@public` / `@beta`+`@experimental`), `AnyTransform` export

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 04-05-PLAN.md — Wave 3: typedoc + api-extractor devDependencies (blocking legitimacy gate), per-entry configs, `scripts/api.sh`, `docs:api`/`api:check`/`api:update`
- [ ] 04-06-PLAN.md — Wave 3: CHANGELOG backfill and deprecations, `docs/STABILITY.md`, README/RELEASE-PLAN/CONTRIBUTING updates, examples on role names

**Wave 4** *(blocked on Wave 3 completion)*
- [ ] 04-07-PLAN.md — Wave 4: strict api-extractor, committed API reports, `api:check` wired into `scripts/ci.sh`, strict typedoc, full `scripts/ci.sh` gate
