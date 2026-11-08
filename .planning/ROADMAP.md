# Roadmap: VizBox

## Milestone v1.0 - Release readiness

- [x] **Phase 01: Plugin architecture** - ChartPlugin registry, adapters, ResizeObserver, tests (complete; commit da94f7a + follow-ups)
- [x] **Phase 02: Viz robustness + test completion** (complete 2026-11-07)
- [x] **Phase 03: Examples app + ESLint** (complete 2026-11-07)
- [x] **Phase 04: Release prep (1.0)** (completed 2026-11-07)

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
**Plans:** 7/7 plans complete (REL-03 only; REL-01 done, REL-02 deferred by owner)

Plans:
**Wave 1**
- [x] 04-01-PLAN.md — Wave 1 tracer: role-based fields end to end on HorizontalBarChart, `@public`/`@deprecated` convention, CHANGELOG seed

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 04-02-PLAN.md — Wave 2: role names + aliases on LineChart/PieChart/ForceGraph/Choropleth, tags on all viz exports
- [x] 04-03-PLAN.md — Wave 2: registry semantics (duplicate-id warn, returned id, deprecated `registerAndGetId`), `groupBy` factory type, tags on registry + transforms
- [x] 04-04-PLAN.md — Wave 2: tags on theme, core and plugin-adapter layers (`@public` / `@beta`+`@experimental`), `AnyTransform` export

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 04-05-PLAN.md — Wave 3: typedoc + api-extractor devDependencies (blocking legitimacy gate), per-entry configs, `scripts/api.sh`, `docs:api`/`api:check`/`api:update`
- [x] 04-06-PLAN.md — Wave 3: CHANGELOG backfill and deprecations, `docs/STABILITY.md`, README/RELEASE-PLAN/CONTRIBUTING updates, examples on role names

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 04-07-PLAN.md — Wave 4: strict api-extractor, committed API reports, `api:check` wired into `scripts/ci.sh`, strict typedoc, full `scripts/ci.sh` gate

### Phase 5: Brand, docs & showcase

**Goal:** Rename VizBox to Lumagrid (package name, export map, etc/ API report names, docs, examples, warning prefix); write user guides; refresh README/ARCHITECTURE/USING/PURPOSE; render SVG/PNG visuals for examples and docs; build a GitHub Pages showcase site (futuristic black background, light-blue neon grid); create a logo and icons.
**Requirements**: TBD
**Depends on:** Phase 4
**Plans:** 7/16 plans executed in 9 waves (REL-02 npm publish stays deferred; D-01..D-21 in 05-CONTEXT.md are the traceable IDs)

Plans:
**Wave 1**
- [x] 05-01-PLAN.md — Wave 1 tracer: rename package, API reports, source, examples and docs to Lumagrid; `[lumagrid]` warning prefix; BREAKING CHANGELOG entry; historical-document notes

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 05-02-PLAN.md — Wave 2: one blocking install checkpoint (playwright-core 1.64.1, d3, recharts, @nivo/bar, opentype.js, fontsource), shared browser launcher, phase scripts, eslint `.mjs` globals, vitest alias

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 05-03-PLAN.md — Wave 3: brand core: pixel-grid mark and favicon, palette tokens with contrast proof, outlined wordmark and lockup, tagline, SVG safety test
- [x] 05-04-PLAN.md — Wave 3: ARCHITECTURE, USING, PURPOSE docs with Mermaid and two neon SVG diagrams
- [x] 05-05-PLAN.md — Wave 3: `scripts/check-docs.mjs`, snippet type-check pipeline, getting-started, transforms and theming chapters

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 05-06-PLAN.md — Wave 4: `npm run brand` generator and validator, favicon set, ICO, app icons, web manifest
- [x] 05-07-PLAN.md — Wave 4: shared demos, `site/` Vite app, deterministic capture page for the seven charts, shell with stub sections, ci.sh site typecheck
- [ ] 05-08-PLAN.md — Wave 4: plugins-and-adapters, troubleshooting and guide index with compiled snippets

**Wave 5** *(blocked on Wave 4 completion)*
- [ ] 05-09-PLAN.md — Wave 5: social card, OG image, README banner and seven chart icons with generated PNGs
- [ ] 05-10-PLAN.md — Wave 5: neon chart theme, hero and the ten-card interactive gallery (seven native, three lazy adapters)

**Wave 6** *(blocked on Wave 5 completion)*
- [ ] 05-11-PLAN.md — Wave 6: neon grid CSS with reduced-motion handling, features strip, links, footer, social metadata

**Wave 7** *(blocked on Wave 6 completion)*
- [ ] 05-12-PLAN.md — Wave 7: `npm run visuals` (14 PNG, 10 SVG), site layout assertions, validator

**Wave 8** *(blocked on Wave 7 completion)*
- [ ] 05-13-PLAN.md — Wave 8: seven chart pages and index with embedded rendered images
- [ ] 05-14-PLAN.md — Wave 8: short README quickstart, docs hub, CHANGELOG and CONTRIBUTING updates

**Wave 9** *(blocked on Wave 8 completion)*
- [ ] 05-15-PLAN.md — Wave 9: hardened Pages workflow with local dry-run; human checkpoints: `gh repo rename`, `git remote set-url`

**Wave 10** *(blocked on Wave 9 completion)*
- [ ] 05-16-PLAN.md — Wave 10: human checkpoints: enable Pages, push; verify the live site
