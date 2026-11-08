# Phase 5: Brand, docs & showcase - Context

**Gathered:** 2026-11-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebrand the project from VizBox to **Lumagrid** and give it a public face:
- a clean rename of the package, repo and identifiers;
- a logo, icons and brand assets;
- a user guide and refreshed core docs (README, ARCHITECTURE, USING, PURPOSE);
- rendered PNG/SVG chart visuals committed for the docs;
- a live, interactive GitHub Pages showcase site (black background, subtle animated light-blue neon grid).

Out of scope:
- REL-02 npm publish. Deferred by the owner; do not start it.
- New chart types or library features.
- Phase 4 review warnings WR-01..04 and IN-02/IN-03. Those are a separate quick task. IN-01 is resolved by the rename in this phase.

**Outward-facing actions need explicit user approval at execution time:** `gh repo rename`, any `git push`, enabling Pages or Actions in the repo settings. Plan these as `checkpoint:human-action` tasks, never autonomous ones.

</domain>

<decisions>
## Implementation Decisions

### Rename
- **D-01:** Clean break, with no `vizbox` alias or shim package. The npm name `lumagrid` (free on npm), the display name "Lumagrid", and the subpaths `lumagrid/transforms|theme|viz|plugins`. Record it in CHANGELOG under Unreleased → Changed (BREAKING: package renamed). — **Reversibility:** one-way — once published as `lumagrid`, the name is the public contract (it hasn't been published yet, so this phase is the last cheap moment).
- **D-02:** Rename the GitHub repo from `bsommers/uitoolbox` to `bsommers/lumagrid`, which makes the Pages URL `https://bsommers.github.io/lumagrid/`. Update `repository`/`homepage`/`bugs` in package.json, links in docs, and the git remote URL. Running `gh repo rename` is a human-approved checkpoint. — **Reversibility:** costly — GitHub redirects the old URL, but external links and Pages URLs change.
- **D-03:** Rename everything that describes the current state: package.json, deno.json, package-lock.json name fields, the etc/ API reports (`etc/lumagrid*.api.md` plus the api-extractor configs), scripts/api.sh, scripts/ci.sh, typedoc.json, src TSDoc `@example` imports and comments, the examples (index.html title, vite/tsconfig aliases), README, CONTRIBUTING, NOTICE, docs/STABILITY.md, docs/RELEASE-PLAN.md, and src/__tests__/barrels.test.ts. Regenerate the API reports with `npm run api:update`. `bash scripts/ci.sh` must pass.
- **D-04:** Leave historical docs as they are: `plans/`, `docs/superpowers/`, `REBUILD.md`, `.security-reports/`, `.planning/` phase artifacts. Add a one-line note at the top of each non-.planning historical doc: "> Historical document — the project was renamed from VizBox to Lumagrid in Phase 5."
- **D-05:** The console warning prefix becomes `[lumagrid]` (resolves review IN-01). Use `lumagrid` in identifiers wherever a name string is needed.

### Logo & brand
- **D-06:** The logo mark is a **glowing grid node**: a 3×3 lattice, one bright cyan node at the center, and a rising data line through the lattice. The geometry must sit **precisely on a pixel grid, symmetric and evenly spaced** (the user flagged the ragged ASCII preview, so alignment matters). The mark must stay legible at 16px. Deliver it as hand-authored SVG, with a horizontal lockup (mark plus the "LUMAGRID" wordmark) and a standalone mark.
- **D-07:** The palette has black backgrounds (#000 to #05070A), primary cyan neon `#00E5FF` with a light variant `#7DF9FF`, and magenta `#FF2BD6` as a sparing accent. Text and UI colors must pass WCAG AA contrast on black. Express them as CSS custom properties (tokens) so the site and any chart theme share them.
- **D-08:** Typography uses Orbitron (wordmark and headings), Inter (body) and JetBrains Mono (code). All three are Google Fonts with OFL licenses. Convert the wordmark text to SVG paths in the logo files, so the logo doesn't depend on the font being loaded.
- **D-09:** Icon assets, all of them:
  - `favicon.svg`, `favicon.ico`, and PNGs at 16/32/180 (apple-touch)/192/512, plus `site.webmanifest`;
  - a 1280×640 GitHub social preview card and an OG image for the site;
  - a wide README hero banner;
  - one small neon icon per native chart type (7 chart types: HorizontalBarChart, LineChart, PieChart, ForceGraph, Choropleth, DataTable, TreeView).
  
  Source SVGs are canonical. PNG/ICO are generated from them by a script and committed.

### Showcase site
- **D-10:** The new `site/` Vite app is **live and interactive**. It imports the library source the way `examples/` does (aliased to `src`) and renders real charts: hover, table sort, force-graph relayout, theme toggle. It reuses or shares the chart demo definitions with `examples/` rather than duplicating data. `examples/` stays the dev playground.
- **D-11:** Deploy with a new GitHub Actions workflow (`.github/workflows/pages.yml`) on push to main (paths filtered to site/src/docs). It builds the site plus the typedoc API reference under `/api`. Pin all third-party actions by full commit SHA, with minimal `permissions` (pages: write, id-token: write) and a timeout. The Vite `base` is `/lumagrid/`. Note: the existing CI workflow is disabled to save minutes. Pages is a separate workflow and runs free on a public repo. The first deploy needs a push and Pages enabled in settings, which is a human checkpoint.
- **D-12:** The site has these sections:
  1. A hero: the animated neon grid, the logo, a tagline, and `npm install lumagrid` plus a ~10-line quickstart.
  2. A feature/architecture strip: the transforms → registry → renderers pipeline, theming and plugins, as neon SVG diagrams.
  3. A chart gallery with all 7 native charts plus the D3, Recharts and Nivo adapter demos, each with a show-code toggle.
  4. Links to the docs and the API: the user guide and `/api` typedoc.
- **D-13:** Background motion is subtle: a slow-scrolling perspective grid with a soft glow pulse, done in CSS (or a tiny canvas) with no animation library. It is fully disabled under `prefers-reduced-motion: reduce`. The page must be usable at phone width and must not scroll horizontally.

### Visuals & docs layout
- **D-14:** A Playwright script, `npm run visuals` (`scripts/render-visuals.*`), renders each chart from the site/examples build in headless Chromium. For each chart it writes a PNG screenshot and an extracted SVG, in both light and dark themes, to `docs/assets/charts/`. Pin `@playwright/test` (or `playwright`) as an exact devDependency. Make the output deterministic: fixed viewport, fixed ForceGraph `seed`, and no animation at capture time. Adding the dependency is an install checkpoint (as in Phase 4 04-05).
- **D-15:** Commit the rendered images. Regenerate them on demand only. Do **not** add Playwright to `scripts/ci.sh`; the local gate stays at about 8s.
- **D-16:** The user guide lives in `docs/guide/`:
  - `getting-started.md`
  - `charts/` with one page per chart (props using the role field names valueField/labelField/idField/colorField, plus an embedded rendered image)
  - `transforms.md`
  - `theming.md`
  - `plugins-and-adapters.md`
  - `troubleshooting.md`
  
  Write it following the `writing-user-guides` skill. Refresh `docs/ARCHITECTURE.md`, `docs/USING.md` and `docs/PURPOSE.md` (create any that are missing). The README becomes a short quickstart with the banner, a chart image strip and links to the guide, site and API. Every code example must compile against the real API (prefer snippets that a typecheck or a test exercises).
- **D-17:** Diagrams are Mermaid in markdown (GitHub renders it), plus hand-tuned neon SVG versions of the key diagrams (pipeline and plugin architecture) for the site and README.

### Claude's Discretion
- The tagline wording.
- The exact Pages path filters and workflow trigger details, within D-11.
- Whether the site shares demos with `examples/` through a shared module (e.g. `examples/src/demos.ts`) or a small workspace folder.
- Playwright vs `playwright-core` with a system Chromium, whichever is lighter and still deterministic.
- How to rasterize SVG to PNG/ICO (e.g. Playwright itself, or a pinned `sharp`/`resvg`), preferring one tool that's already present.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current public surface and gates (rename targets)
- `package.json` — name, export map, scripts (`api:check`, `api:update`, `docs:api`, `examples:*`).
- `etc/api-extractor.*.json`, `etc/vizbox*.api.md`, `scripts/api.sh` — API report names to rename and regenerate.
- `scripts/ci.sh` — local gate; must stay green and must not gain Playwright.
- `typedoc.json` — API docs config (output `docs/api/`, gitignored; site publishes it under `/api`).
- `src/index.ts`, `src/plugins/*-adapter.ts(x)`, `src/registry/types.ts`, `src/registry/native-plugin.tsx`, `src/registry/index.ts` (warning prefix) — `vizbox` strings in TSDoc and the code.
- `src/__tests__/barrels.test.ts` — references the package name.
- `examples/index.html`, `examples/vite.config.ts`, `examples/tsconfig.json`, `examples/src/main.tsx` — demo app to share with site/.

### Docs and policy
- `README.md`, `CONTRIBUTING.md`, `NOTICE`, `CHANGELOG.md` — rename and refresh; CHANGELOG gets the BREAKING rename entry.
- `docs/STABILITY.md`, `docs/RELEASE-PLAN.md` — rename; keep policy content.
- `.planning/phases/04-release-prep-1-0/04-CONTEXT.md` — Phase 4 decisions (role field names D-01/D-02, stability tags D-08..D-10) that the guide must document accurately.
- `.planning/phases/04-release-prep-1-0/04-REVIEW-DISPOSITION.md` — IN-01 is closed by D-05.

### CI and workflows
- `.github/workflows/ci.yml` — existing (disabled) CI; follow its minute-saving and hardening style for pages.yml.

### Skills to apply
- `writing-user-guides` (docs/guide structure), `hardening-ci-workflows` (pages.yml), `dataviz` and `artifact-design` principles for palette contrast (reference only).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `examples/` Vite app (aliased to `src`) already renders the charts. The site can reuse its demo data and Vite alias setup.
- The theme layer (`lightTheme`/`darkTheme`, `ThemeProvider`) can take a neon "lumagrid" site theme built from the D-07 tokens. Keep it inside site/ unless there's a reason to ship it.
- ForceGraph has a `seed` prop (experimental), which gives deterministic layouts for the visuals.

### Established Patterns
- Exact-pinned devDependencies with an install approval checkpoint (Phase 4 04-05: typedoc, api-extractor).
- Local-first CI (`scripts/ci.sh` via the pre-push hook); hosted CI disabled to save minutes.
- Conventional commits feed the CHANGELOG.
- About 152 `vizbox` occurrences across ~40 files (excluding node_modules/dist/coverage/.planning).

### Integration Points
- `npm run api:update` must be rerun after the rename, so the etc/ reports and ci.sh api:check agree.
- `docs/api/` is gitignored; the Pages workflow builds it fresh.
- The ESLint ignore list may need `site/dist/**` and Playwright output folders.

</code_context>

<specifics>
## Specific Ideas

- The user gave the brief: "futuristic black background with light blue neon grid", "snazzy graphics, great examples", "super sick logo and icons".
- The logo must be precisely aligned. The user noticed the ragged first line in the ASCII preview.

</specifics>

<deferred>
## Deferred Ideas

- Phase 4 review fixes (WR-01..04, IN-02, IN-03) — separate haiku/sonnet quick task.
- Analytics/SEO beyond basic meta tags and the OG image — not discussed.
- REL-02 npm publish — owner-deferred.
- Visual regression testing using the rendered images — later 1.0-readiness work.

</deferred>

---

*Phase: 05-brand-docs-showcase*
*Context gathered: 2026-11-07*
