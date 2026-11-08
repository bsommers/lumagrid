# Phase 5: Brand, docs & showcase - Research

**Researched:** 2026-11-07
**Domain:** Package rename + brand assets + Vite showcase site + Playwright visuals + GitHub Pages + user-guide docs
**Confidence:** HIGH (rename, api-extractor, Playwright, ICO, actions SHAs, contrast were all executed or queried this session); MEDIUM (logo pixel-grid craft, site UX)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)
- Phase 4 review fixes (WR-01..04, IN-02, IN-03) — separate haiku/sonnet quick task.
- Analytics/SEO beyond basic meta tags and the OG image — not discussed.
- REL-02 npm publish — owner-deferred.
- Visual regression testing using the rendered images — later 1.0-readiness work.
</user_constraints>

<phase_requirements>
## Phase Requirements

No requirement IDs were supplied (ROADMAP: "Requirements: TBD"; REQUIREMENTS.md has REL-01..03 only). Planner: treat D-01..D-17 as the traceable IDs. No CLAUDE.md exists in the repo (`./CLAUDE.md` absent); global CLAUDE.md imposes only subagent-model rules (not relevant to code).
</phase_requirements>

## Summary

The rename is mechanical and low-risk: it was **rehearsed end to end in a scratch copy** (sed over the target list, `mv etc/vizbox*.api.md → etc/lumagrid*.api.md`, `npm run api:update`, `bash scripts/ci.sh`) and `local CI passed in 11s`. Without `api:update`, `api:check` fails with "You have changed the API signature" because each report's line 1 embeds the package name (`## API Report File for "lumagrid"`). Two real surprises: (1) the warning prefix that IN-01 flagged is `[uitoolbox]` in `src/registry/index.ts:25` (not `vizbox`) and the Recharts adapter has two `[vizbox]` prefixes (`recharts-adapter.ts:75,86`), so both must be changed for D-05; (2) `package.json` has **no** `repository`/`homepage`/`bugs` fields today — D-02 means *add* them.

For D-14, use **`playwright-core` pinned exact (recommend `1.64.1`, a month old; `1.65.0` was published 2026-11-05 and the legitimacy seam flags it `SUS: too-new`)** driving a browser found at runtime (env override, then Playwright-managed Chromium, then system Chrome). Both 1.64.1 and 1.65.0 were exercised here against `/usr/bin/google-chrome` 156: PNG screenshots are byte-deterministic (two captures → identical SHA-256) and a hand-written ICO container verified with ImageMagick `identify`. Playwright alone also handles all PNG rasterization, so no `sharp`/`resvg`/`png-to-ico` is needed. Extract chart SVG with `XMLSerializer` (not `outerHTML`: React-rendered SVG has no `xmlns`, verified). The wordmark-to-paths step uses a one-off `opentype.js@2.0.0` script (verified loading the Orbitron variable TTF and static fontsource woff).

Surprises that change scope: the adapter gallery (D3/Recharts/Nivo) needs **`d3`, `recharts`, `@nivo/bar` installed** — none are in `node_modules` today (only `@types/d3`) — so they are new devDependencies (install checkpoint). `Choropleth` has **no projection engine**: it needs pre-projected SVG path strings (`projectedPaths`), so the demo must hand-author paths (a neon hex-tile map is the natural fit). `DataTable` and `TreeView` are HTML, so they get PNG only. Never run `scripts/ci.sh` in a copy with a **symlinked** `node_modules`: its `npm ci` branch (lockfile newer than `node_modules/.package-lock.json`, which happens after any lockfile edit) follows the symlink and empties the real directory (this happened to me once during research; restored with `npm ci`, repo tree unchanged). After the real lockfile rename edit, ci.sh will legitimately run `npm ci` once.

**Primary recommendation:** Execute in this order: rename (verified recipe below) → brand sources + generator script → shared demos + `site/` → `capture.html` + `render-visuals.mjs` → docs/guide with typechecked snippets → `pages.yml` → checkpoints (installs, `gh repo rename`, push, Pages enable).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Library rename, API reports | Build/Repo tooling (npm, api-extractor) | — | Pure source/config edit; gate is `scripts/ci.sh` |
| Chart rendering on the site | Browser / Client (React, SVG/HTML) | — | Library is client-only; no SSR |
| Neon grid background, reduced-motion | Browser / Client (CSS) | — | Compositor-only CSS animation, no JS |
| Static hosting (site + `/api`) | CDN / Static (GitHub Pages) | CI (pages.yml build) | One artifact: `site/dist` + copied `docs/api` |
| Chart image rendering (PNG/SVG) | Local Node script + headless Chromium | — | On-demand, committed output, not in CI gate |
| Brand asset generation (PNG/ICO/manifest) | Local Node script (Playwright raster) | — | SVG sources canonical, outputs committed |
| Guide code correctness | Build/Repo tooling (tsc + vitest) | — | Snippets typechecked in the local gate |
| Repo rename, Pages enablement, push | Human (GitHub settings) | — | Outward-facing; `checkpoint:human-action` |

## Standard Stack

### Core (new, all devDependencies; every install is an approval checkpoint)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `playwright-core` | `1.64.1` exact (`1.65.0` also verified working) | Headless Chromium for visuals + SVG→PNG raster | `npm view`: 1.64.1 published 2026-10-14, 1.65.0 2026-11-05; Apache-2.0; single dep-free-ish pkg, 14 MB installed, no postinstall (`npm view playwright-core scripts.postinstall` empty) [VERIFIED: npm registry] |
| `vite` | `5.4.21` (already installed transitively via `@vitejs/plugin-react@4.7.0`) | Site dev/build, `preview()` API for capture | Installed version is `vite/5.4.21` (`node_modules/.bin/vite --version`). Latest on registry is 8.3.6 — do **not** jump majors in this phase. Consider adding it as an explicit exact devDependency (same version, no behavior change) [VERIFIED: local + npm registry] |
| `@fontsource-variable/orbitron`, `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono` | `5.3.0` each | Self-hosted woff2 for site (no Google CDN request, deterministic capture fonts) | All 5.3.0, license OFL-1.1 (checked `@fontsource/orbitron`), legitimacy seam `OK` for all three [VERIFIED: seam + npm] |
| `d3` | `7.9.2` (npm `latest`) | D3 adapter demo | Optional peer dep of the library; not installed today. Seam says `SUS: too-new` (registry metadata touched 2026-11-03) — keep, add human-verify checkpoint [VERIFIED: seam] |
| `recharts` | `3.10.1` | Recharts adapter demo | Seam `OK`; peer `react ^16.8 … ^19` OK with React 18.3.1 [VERIFIED: seam + npm] |
| `@nivo/bar` (+ `@nivo/core`) | `0.99.0` | Nivo adapter demo | Seam `OK`; peer `react ^16.14 … ^19` [VERIFIED: seam + npm] |

### One-off (do NOT commit as dependency; run via `npx -p`)

| Tool | Version | Use |
|------|---------|-----|
| `opentype.js` | `2.0.0` | Wordmark text→SVG path (`scripts/brand/wordmark.mjs`, run with `npx -p opentype.js@2.0.0 node scripts/brand/wordmark.mjs`, or keep as devDependency if the owner prefers regeneration). Seam `OK`, 4.4M/wk, repo `opentypejs/opentype.js`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `playwright-core` | `playwright` / `@playwright/test` | Same engine plus test runner/CLI/ffmpeg bits; D-14 permits either. Heavier and a test runner is unused. `playwright-core` + executablePath is the lighter deterministic choice (CONTEXT Discretion). |
| Playwright raster | `sharp` 0.35.5, `@resvg/resvg-js` 2.6.2, `png-to-ico` 3.0.2 | Extra native/binary deps for what Playwright already does; `png-to-ico` is replaced by a 25-line ICO writer (verified below). |
| opentype.js | fonttools (`pip`, not installed here: `ModuleNotFoundError`), Inkscape/ImageMagick (present locally: `/usr/bin/inkscape`, `/usr/bin/magick`) | Local CLIs are not reproducible on other machines/CI; opentype.js is a pinned, scriptable, committed approach. Manual path authoring is rejected: text outlines are not hand-alignable. |

**Installation (after approval checkpoint):**
```bash
npm install --save-dev --save-exact playwright-core@1.64.1 \
  @fontsource-variable/orbitron@5.3.0 @fontsource-variable/inter@5.3.0 @fontsource-variable/jetbrains-mono@5.3.0 \
  d3@7.9.2 recharts@3.10.1 @nivo/bar@0.99.0
# vite@5.4.21 already resolves transitively; pin explicitly only if the planner wants it in package.json
```
Run `npm install` then `bash scripts/ci.sh` once (lockfile changed, so ci.sh will `npm ci`; fine on a real directory).

## Package Legitimacy Audit

Seam run: `gsd_run query package-legitimacy check --ecosystem npm …` (note: it checks package *names* against latest; `name@version` is rejected as `SLOP`, so pass bare names).

| Package | Registry | Age/last publish | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|------------------|-----------|-------------|---------|-------------|
| playwright-core | npm | latest 2026-11-05 (1.64.1: 2026-10-14) | 185M/wk | github.com/microsoft/playwright | SUS (too-new, only because latest is 2 days old) | Flagged — pin 1.64.1; planner adds `checkpoint:human-verify` before install |
| @playwright/test | npm | 2026-11-05 | 112M/wk | github.com/microsoft/playwright | SUS (too-new) | Not recommended (alternative only) |
| opentype.js | npm | 2026-05-06 | 4.4M/wk | github.com/opentypejs/opentype.js | OK | Approved (one-off) |
| @fontsource-variable/orbitron | npm | 2026-07-19 | 29k/wk | github.com/fontsource/font-files | OK | Approved |
| @fontsource-variable/inter | npm | 2026-07-19 | 10.7M/wk | github.com/fontsource/font-files | OK | Approved |
| @fontsource-variable/jetbrains-mono | npm | 2026-07-19 | 3.7M/wk | github.com/fontsource/font-files | OK | Approved |
| d3 | npm | 2026-11-03 (metadata) | 32.5M/wk | github.com/d3/d3 | SUS (too-new) | Flagged — planner adds `checkpoint:human-verify`; popular, well-known package |
| recharts | npm | 2026-07-25 | 64M/wk | github.com/recharts/recharts | OK | Approved |
| @nivo/bar, @nivo/core | npm | 2025-05-23 | 1.2M / 2.0M per wk | github.com/plouc/nivo | OK | Approved |

`npm view <pkg> scripts.postinstall` is empty for playwright-core, recharts, @nivo/bar, d3, @fontsource-variable/orbitron. **Packages removed (SLOP): none.** **Flagged SUS:** `playwright-core`, `d3` (and `@playwright/test` if chosen instead). All names above came from CONTEXT/official docs or the npm registry page itself; versions confirmed with `npm view`.

## Architecture Patterns

### System Architecture Diagram

```
  brand/*.svg (canonical, hand-authored)
        |  scripts/build-brand.mjs  (Playwright raster + ICO writer)
        v
  site/public/{favicon.svg,favicon.ico,icon-*.png,apple-touch-icon.png,og.png,site.webmanifest}
  docs/assets/{social-preview.png, banner.svg/.png, chart-icons/}

  examples/shared/demos.ts(x) --(imports)--> examples/src/main.tsx   (dev playground)
        |                       \-(imports)-> site/src/*  (gallery, hero quickstart data)
        |                                         |
        |                                   vite build (base=/lumagrid/) ---> site/dist/{index.html,capture.html,assets}
        |                                                                          ^
  npm run visuals: scripts/render-visuals.mjs                                      |
     vite preview() API on site/dist  -> Playwright(Chromium) -> capture.html?chart=X&theme=T&seed=1
        -> XMLSerializer(svg) + element screenshot
        -> docs/assets/charts/<chart>-<theme>.{png,svg}   (committed)

  push to main --> .github/workflows/pages.yml
     job build: npm ci -> npm run docs:api (typedoc -> docs/api) -> vite build site -> cp -r docs/api site/dist/api
                -> configure-pages -> upload-pages-artifact(site/dist)
     job deploy: deploy-pages (environment github-pages)  ==>  https://bsommers.github.io/lumagrid/ (+ /api/)

  Guide: docs/guide/*.md  <-sync check->  docs/guide/snippets/*.tsx (tsc + vitest + eslint, alias lumagrid -> src)
```

### Recommended Project Structure
```
brand/                     # canonical SVG sources: mark.svg, lockup.svg, wordmark.svg (paths), favicon.svg, banner.svg, social.svg, og.svg, icons/chart-*.svg, tokens.css
scripts/
  build-brand.mjs          # SVG -> PNG sizes + ICO + manifest (Playwright); `npm run brand`
  brand/wordmark.mjs       # one-off opentype.js text->path (committed output in brand/wordmark.svg)
  render-visuals.mjs       # `npm run visuals`
  check-docs.mjs           # relative-link + snippet-sync + no-"vizbox" check (no deps)
examples/shared/demos.ts   # data + view configs shared by examples/ and site/ (NOT under examples/src, so tsconfig include stays tidy)
site/
  index.html, capture.html, vite.config.ts, tsconfig.json
  public/                  # generated brand outputs (committed)
  src/{main.tsx, App.tsx, sections/*, theme/lumagridTheme.ts, styles/tokens.css, styles/grid.css, demos/*}
docs/guide/{README.md,getting-started.md,transforms.md,theming.md,plugins-and-adapters.md,troubleshooting.md,charts/*.md,snippets/*.tsx,snippets/tsconfig.json}
docs/{ARCHITECTURE.md,USING.md,PURPOSE.md}          # all three are missing today (`ls docs`: RELEASE-PLAN.md STABILITY.md api superpowers)
docs/assets/charts/*.png|svg
```

### Pattern 1: Rename recipe (verified in scratch copy; ci.sh green in 11s)
```bash
# 1. mechanical edit list (all verified to exist; see Inventory below)
git mv etc/vizbox.api.md etc/lumagrid.api.md   # likewise -plugins -theme -transforms -viz
sed -i 's/vizbox/lumagrid/g; s/VizBox/Lumagrid/g' package.json package-lock.json deno.json \
  etc/api-extractor.*.json scripts/api.sh scripts/ci.sh typedoc.json \
  examples/vite.config.ts examples/tsconfig.json examples/index.html examples/src/main.tsx \
  src/index.ts src/plugins/*.ts src/plugins/*.tsx src/registry/*.ts src/registry/*.tsx \
  src/__tests__/barrels.test.ts README.md CONTRIBUTING.md NOTICE docs/STABILITY.md docs/RELEASE-PLAN.md
# deno.json: "@vizbox/vizbox" becomes "@lumagrid/lumagrid" via the same sed (verified)
sed -i 's/\[uitoolbox\]/[lumagrid]/' src/registry/index.ts     # the real IN-01 prefix
npm run api:update        # = build:esm + api-extractor --local on 5 entry points; rewrites line 1 of each report
bash scripts/ci.sh
```
Do **not** sed historical files (D-04). The `sed` over README rewrites `npm install vizbox` correctly; review the diff (README is also rewritten in this phase).

### Pattern 2: Capture page + deterministic Playwright script
`site/capture.html` (second Vite input, `<meta name="robots" content="noindex">`) reads `?chart=bar|line|pie|force|choropleth|table|tree&theme=light|dark&seed=1`, renders **the native component directly** inside `ThemeProvider` at a fixed box (e.g. 640×400), no ViewSwitcher chrome, sets `data-capture-ready="1"` on `#capture` after `document.fonts.ready` and one `requestAnimationFrame` (ForceGraph computes its layout synchronously in `useMemo`, deterministic for a given `seed`; its `circle`s appear after one effect pass).
```js
// scripts/render-visuals.mjs (sketch; Node ESM)
import { chromium } from 'playwright-core';
import { build, preview } from 'vite';
import { existsSync } from 'node:fs';
// build the site once (or reuse site/dist), then preview via Vite's JS API (no extra dep)
const server = await preview({ root: 'site', configFile: 'site/vite.config.ts', preview: { port: 4173, host: '127.0.0.1' } });
const exe = process.env.LUMAGRID_CHROME ?? (existsSync(chromium.executablePath()) ? chromium.executablePath() : '/usr/bin/google-chrome');
const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 800, height: 520 }, deviceScaleFactor: 2,
  reducedMotion: 'reduce', colorScheme: 'dark' });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:4173/lumagrid/capture.html?chart=${chart}&theme=${theme}&seed=1`);
await page.waitForSelector('#capture[data-capture-ready="1"]');
const box = page.locator('#capture');
await box.screenshot({ path: `docs/assets/charts/${chart}-${theme}.png`, animations: 'disabled', caret: 'hide' });
const svg = await page.evaluate(() => {              // SVG charts only
  const el = document.querySelector('#capture svg[role="img"]');
  return el ? new XMLSerializer().serializeToString(el) : null;   // adds xmlns (outerHTML does not)
});
```
Verified here: `outerHTML` of a DOM-created `<svg>` is `<svg width="10"></svg>` (no `xmlns`), while `XMLSerializer` gives `<svg xmlns="http://www.w3.org/2000/svg" width="10"/>`. A standalone `.svg` file or `<img src>` needs `xmlns`.
- Charts style via **inline attributes / `style` props** (no class names, no `<style>`; `grep className|<style src/viz` found none), so the serialized SVG is self-contained. Only `font-family: 'Inter', 'Helvetica Neue', Arial` is by name: when the `.svg` is viewed as `<img>` it falls back to Helvetica/Arial (acceptable; document it). PNGs use the site-loaded Inter (wait for `document.fonts.ready`).
- SVG charts: bar, line, pie, force-graph, choropleth (SVG when `projectedPaths` given). **HTML charts: DataTable, TreeView → PNG only** (do not wrap in `foreignObject`; document the exception in `docs/assets/charts/README.md`). That gives 14 PNG + 10 SVG = 24 files.
- Determinism: fixed viewport + DSF 2, `reducedMotion: 'reduce'`, `animations: 'disabled'`, `seed: 1`, fonts awaited, same Chromium. Record `browser.version()` in the script log. Playwright-bundled Chromium for 1.64.1 is revision `1248` (not installed here; downloading it, `npx playwright-core install chromium`, is a human checkpoint). Locally available alternatives: `/usr/bin/google-chrome` 156.0.8078.79 (works: tested). Pixel output can differ across Chromium/OS/font stacks, which is exactly why images are committed and regenerated on demand only.

### Pattern 3: ICO without dependencies (tested; `identify` reports `PNG 16x16`, `PNG 32x32`)
```js
function ico(pngs /* [{size, buf}] */) {
  const n = pngs.length, head = Buffer.alloc(6 + 16 * n);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(n, 4);   // ICONDIR: reserved, type=1, count
  let off = head.length;
  pngs.forEach(({ size, buf }, i) => {
    const o = 6 + 16 * i;
    head[o] = size >= 256 ? 0 : size; head[o + 1] = size >= 256 ? 0 : size;       // width, height (0 = 256)
    head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);                   // planes, bpp
    head.writeUInt32LE(buf.length, o + 8); head.writeUInt32LE(off, o + 12); off += buf.length;
  });
  return Buffer.concat([head, ...pngs.map((x) => x.buf)]);
}
```
PNG from SVG with Playwright: `page.setContent('<body style="margin:0;background:transparent">' + svgWithWidthHeight + '</body>')`, viewport = size, `page.screenshot({ omitBackground: true, type: 'png', animations: 'disabled' })` (transparent background, tested; two runs → identical hash). ICO contents: embed 16, 32 (and 48 optional). PNG sizes per D-09: 16/32/180/192/512; OG 1200×630 and social 1280×640 from `brand/og.svg`/`brand/social.svg` the same way (viewport = target size).

### Pattern 4: Wordmark text → paths (tested)
`opentype.js@2.0.0` parses the Orbitron variable font (`google/fonts` repo `ofl/orbitron/Orbitron[wght].ttf`, 38 576 bytes, tables incl. `fvar,gvar,avar,hvar`) and exposes `font.variation.set({wght: 700})`; `font.getPath('LUMAGRID', 0, 0, fontSize).toPathData(2)` yields the path. Static fontsource files (`@fontsource/orbitron/files/orbitron-latin-700-normal.woff`) also parse (`.woff2` does **not** parse without an external decompressor). For "LUMAGRID" the advance width was identical (437.328 at 72 px) for weights 500/700/900, so weight changes do not move glyph positions. Write the resulting `d` into `brand/wordmark.svg` (round to 2 decimals, `viewBox` snapped to integers), then compose `brand/lockup.svg` with `<use>` or by inlining. Commit the script and the OFL notice (see Licenses).
Licenses: Orbitron `OFL.txt` begins "Copyright 2018 The Orbitron Project Authors (https://github.com/theleagueof/orbitron), with Reserved Font Name: "Orbitron" … SIL Open Font License, Version 1.1" [VERIFIED: raw.githubusercontent.com/google/fonts/main/ofl/orbitron/OFL.txt]. OFL allows embedding/derivation of outlines into artwork; the Reserved Font Name only restricts naming a modified *font*. Ship `@fontsource` license files via the packages; add a short "Fonts" line to NOTICE/README credit (Orbitron, Inter, JetBrains Mono: OFL-1.1).

### Pattern 5: Logo geometry on a pixel grid (D-06)
Design the mark in an integer viewBox where **both 16 and 32 px renders land on whole pixels**: `viewBox="0 0 64 64"`, lattice nodes at 8 / 32 / 56 (pitch 24), stroke widths 2, node radius 3 (center node 7). 64/16 = 4 and 64/32 = 2, so lattice coordinates map to 2/8/14 px (16 px) and 4/16/28 px (32 px). Symmetry rule: every coordinate `x` must have a mirror `64 − x` in the file. A 1 px line centered on an integer 16 px coordinate straddles two pixels (blur), so ship a **dedicated simplified `favicon.svg`** (center node + 2 lattice lines + rising line, strokes widened to 2 units at 64 → 0.5 px is too thin, use 4) rather than shrinking the full mark. Skip SVG `filter` glow in favicon/16 px sources (rasterizes muddy); use glow only in banner/lockup. [ASSUMED: specific stroke widths; adjust after viewing 16 px output.]

### Pattern 6: prefers-reduced-motion grid (D-13)
```css
:root { --lg-bg:#05070A; --lg-cyan:#00E5FF; --lg-cyan-light:#7DF9FF; --lg-magenta:#FF2BD6; --lg-text:#C9D1D9; --lg-muted:#9AA4B2; --cell:48px; }
html, body { background:#000; overflow-x: clip; }            /* never scroll horizontally */
.grid-bg { position:fixed; inset:0; overflow:hidden; pointer-events:none; z-index:-1; }
.grid-bg::before { content:""; position:absolute; left:-50%; right:-50%; bottom:0; height:200%;
  background-image:
    linear-gradient(to right, rgb(0 229 255 / .22) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(0 229 255 / .22) 1px, transparent 1px);
  background-size: var(--cell) var(--cell);
  transform: perspective(500px) rotateX(62deg) translateY(0); transform-origin: 50% 100%;
  animation: grid-scroll 8s linear infinite; will-change: transform; }
@keyframes grid-scroll { to { transform: perspective(500px) rotateX(62deg) translateY(var(--cell)); } } /* one cell = seamless loop */
.grid-bg::after { content:""; position:absolute; inset:0;
  background: radial-gradient(60% 40% at 50% 100%, rgb(0 229 255 / .18), transparent 70%);
  animation: glow 6s ease-in-out infinite alternate; }
@keyframes glow { from { opacity:.55 } to { opacity:1 } }
@media (prefers-reduced-motion: reduce) { .grid-bg::before, .grid-bg::after { animation: none; } }
```
Only `transform`/`opacity` animate (compositor, no layout). The static grid still renders under reduce. Add `@media (max-width:600px){ :root{ --cell:32px } }`.

### Anti-Patterns to Avoid
- **Symlinked `node_modules` + `scripts/ci.sh`** (empties the real tree via `npm ci`). Copy trees for rehearsals with their own install or run `scripts/ci.sh` only in the real repo.
- Importing the capture page through `ViewSwitcher`/`WidgetContainer` (adds ResizeObserver timing and tab chrome to screenshots).
- Using `outerHTML` for extracted SVG (no `xmlns`).
- `sed` over `.planning/`, `plans/`, `REBUILD.md` etc. (D-04) — they get a header note only.
- Adding `site/` as an npm workspace (the repo is a single package; `files: ["dist"]` keeps site/docs out of the tarball).
- Loading fonts from Google's CDN on the site (privacy, flaky screenshots); use `@fontsource-variable/*`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser automation / screenshots | puppeteer-style custom CDP | `playwright-core` | Stable API, `animations: 'disabled'`, element screenshots |
| Text → glyph paths | Hand-drawn Orbitron letters | `opentype.js` one-off | Exact outlines/kerning; hand paths can't match the font |
| Static server for capture | Custom http server | Vite's `preview()` API | Honors `base`, already installed |
| Font hosting | Manual woff2 download | `@fontsource-variable/*` | Versioned, OFL, license files included |
| API docs | Markdown tables of exports | typedoc (`npm run docs:api`) | Already gated; `treatWarningsAsErrors` |
| Pages publishing | `gh-pages` branch push / third-party deploy action | `actions/upload-pages-artifact` + `actions/deploy-pages` | First-party OIDC deploy, no branch |
| Contrast math | Eyeballing | WCAG formula (script in tests) | Automatable; formula below |
| ICO | `png-to-ico` dependency | 25-line writer above | Verified; zero deps |

**Key insight:** every "tool" need in this phase is met by Playwright + Vite + a few small Node scripts; new dependencies beyond the demo libs should be refused.

## Runtime State Inventory (rename phase)

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. The library has no datastore; no stored keys embed `vizbox`. | None (verified: `grep -ri vizbox` finds only the files listed in Inventory) |
| Live service config | GitHub repo `bsommers/uitoolbox` (PUBLIC; `gh api repos/bsommers/uitoolbox/pages` → 404, Pages not enabled). Local git remote `origin https://github.com/bsommers/uitoolbox`. `.ontology/domain_schema.ttl:2` has IRI `http://bsommers.github.io/uitoolbox/` and `.ontology/README.md:1` "uitoolbox". | Human checkpoints: `gh repo rename lumagrid`, `git remote set-url origin https://github.com/bsommers/lumagrid`, enable Pages (Source: GitHub Actions). Decide whether to update `.ontology` (not listed in D-03; recommend leaving or a trivial IRI rename — flag to user) |
| OS-registered state | None. Pre-push hook is `.githooks/pre-push` (path-based, no name). | None |
| Secrets / env vars | None reference the name. | None |
| Build artifacts | `dist/`, `examples/dist/` (gitignored; `examples/dist/index.html` still says "VizBox example"), `docs/api/` (gitignored), `temp/` (api-extractor scratch, gitignored), `coverage/`. `node_modules/.package-lock.json` goes stale after lockfile name edit (ci.sh then runs `npm ci` once). | Rebuild via `npm run build`/`api:update`; no manual action |

**Not in the CONTEXT's rename list but occurring:** `src/registry/index.ts:25` `[uitoolbox]`; `src/plugins/recharts-adapter.ts:75,86` `[vizbox]`; `package.json` has no `repository`/`homepage`/`bugs`.

## Rename Inventory (Q1) — grep -i vizbox, excl. node_modules/dist/coverage/.planning/.git/graphify-out/temp

150 lines across 38 tracked files (`git grep -c -i vizbox -- . ':!.planning'`), of which 6 are historical (D-04) and 6 generated.

| File | Lines (hits) | Notes |
|------|--------------|-------|
| `package.json` | L2 name (1) | Add `repository`, `homepage`, `bugs`; keywords |
| `package-lock.json` (generated) | L2, L8 (2) | Edit via sed (verified) or `npm install --package-lock-only` |
| `deno.json` | L2 `"@vizbox/vizbox"` | → `@lumagrid/lumagrid` |
| `scripts/ci.sh` L2, `scripts/api.sh` L2 | comments | |
| `typedoc.json` | L12 `"name": "VizBox"` | → `"Lumagrid"` |
| `etc/api-extractor.index.json` L4 and `.plugins.json` L12, `.theme.json` L4, `.transforms.json` L4, `.viz.json` L12 | `reportFileName` | `etc/api-extractor.base.json` has none |
| `etc/vizbox.api.md`, `-plugins`, `-theme`, `-transforms`, `-viz` (generated) | L1 `## API Report File for "vizbox"` + filename | `git mv` then `api:update` |
| `examples/index.html` L6; `examples/vite.config.ts` L13-14; `examples/tsconfig.json` L9; `examples/src/main.tsx` L3, L4, L11 | title, alias regexes, `paths`, imports | |
| `src/index.ts` L62; `src/plugins/d3-adapter.tsx` L7, L8, L62, L67; `nivo-adapter.ts` L87, L92; `recharts-adapter.ts` L8, L75, L86, L108; `src/registry/native-plugin.tsx` L47; `src/registry/types.ts` L19, L32, L37, L41 | comments/TSDoc + 2 runtime warning strings | `ae-` reports include TSDoc? Only line 1 differed in rehearsal |
| `src/__tests__/barrels.test.ts` L21, L30, L34, L39, L42, L43 | record keys only (`'vizbox/core'` etc.) | tests do not assert the warning text |
| `README.md` (15 lines), `CONTRIBUTING.md` L7, `NOTICE` L1, `docs/STABILITY.md` L3, L13, L23 (7 hits), `docs/RELEASE-PLAN.md` L33 | docs | README is rewritten anyway |
| **Historical (D-04, header note only):** `plans/vizbox.md`, `plans/refactor-plugin-architecture.md`, `REBUILD.md`, `.security-reports/scan-2026-04-05.md`, `docs/superpowers/plans/2026-08-06-nivo-adapter.md`, `docs/superpowers/specs/2026-08-06-nivo-adapter-design.md` | 5, 14, 56, 6, 8, 3 hits | add the note line at top of each (6 files; `.claude/checkpoints/*` is untracked, ignore) |

Done-check: `git grep -il vizbox -- . ':!.planning' ':!plans' ':!REBUILD.md' ':!docs/superpowers' ':!.security-reports' ':!CHANGELOG.md'` must be empty; same for `uitoolbox` (except `.ontology` if left alone).

## api-extractor mechanics (Q2)

- Report name per entry is the explicit `"apiReport": { "reportFileName": "…" }` in `etc/api-extractor.<entry>.json` (index→`vizbox.api.md`, plugins→`vizbox-plugins.api.md`, theme, transforms, viz). No `<unscopedPackageName>` token is used. `reportFolder` is `<projectFolder>/etc/`, scratch is `<projectFolder>/temp/`.
- `npm run api:update` = `npm run build:esm && bash scripts/api.sh update`; `update` passes `--local` so reports are rewritten in `etc/`; `check` fails ("You have changed the API signature … copy temp/… to etc/…") when the committed file differs; line 1 `## API Report File for "<package.json name>"` changes with the rename, so **both** the config edits **and** `api:update` are needed. Verified: after renaming files+configs and running `npm run api:update` (5× "API Extractor completed successfully"), `etc/lumagrid.api.md` line 1 = `## API Report File for "lumagrid"` and `scripts/ci.sh` passed in 11 s (typecheck, lint, tests+coverage, build, api:check, examples build).
- Delete stale `etc/vizbox*.api.md` (use `git mv`) so there are no orphans.

## Site setup (Q7)

`examples/vite.config.ts` pattern: `root`, `plugins: [react()]`, `resolve.alias` array of regexes (specific subpath first), `build.outDir`. For site:
```ts
// site/vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
  root: here('.'), base: '/lumagrid/', plugins: [react()],
  resolve: { alias: [
    { find: /^lumagrid\/transforms$/, replacement: here('../src/transforms/index.ts') },
    { find: /^lumagrid\/theme$/,      replacement: here('../src/theme/index.ts') },
    { find: /^lumagrid\/viz$/,        replacement: here('../src/viz/index.ts') },
    { find: /^lumagrid\/plugins$/,    replacement: here('../src/plugins/index.ts') },
    { find: /^lumagrid$/,             replacement: here('../src/index.ts') },
  ] },
  build: { outDir: here('./dist'), emptyOutDir: true,
    rollupOptions: { input: { main: here('./index.html'), capture: here('./capture.html') } } },
});
```
(examples aliases only root and `/viz`; the site also needs `/transforms`, `/theme`, `/plugins` for its quickstart/guide code.) Use `import()` for the adapter demos so d3/recharts/nivo are separate lazy chunks.
- `site/tsconfig.json`: extend `../tsconfig.json`, `noEmit`, `declaration:false`, `declarationMap:false`, `rootDir:".."`, `baseUrl:"."`, `paths` mirroring the aliases, `types:["vite/client"]`, `include:["src","../examples/shared"]`. Same pattern as `examples/tsconfig.json` (which type-checks clean today in 0.86 s: `npx tsc -p examples/tsconfig.json --noEmit`, but it is **not** in ci.sh).
- Shared demos: create `examples/shared/demos.ts` (data for sales/tree, a ForceGraph nodes+edges `TransformedData`, hex-tile `GeoData` + `projectedPaths`, DataTable rows, view configs using role field names). Refactor `examples/src/main.tsx` (currently inline `sales`, `salesFields`, `views`) to import it. Choropleth needs `projectedPaths: Record<id, svgPathString>` (`src/viz/__tests__/choropleth.test.tsx` shows `projectedPaths: { a: 'M0,0L1,1Z' }`); there is no projection code, so author hex/tile paths by hand/script.
- Registry: the example registers only bar/line/pie/table/tree plugins; the site should register all 7 (`nativeChoroplethPlugin`, `nativeForceGraphPlugin` exist in `src/viz/plugins.ts`).
- Site theme: a `ThemeDefinition` (`name`, `colors{categorical,sequential,diverging}`, `typography`, `spacing`, `surface`, `text`; see `src/theme/dark.ts`) built from the D-07 tokens, kept inside `site/src/theme/`.
- ci.sh integration (~+2 s): add scripts `"typecheck:site": "tsc -p site/tsconfig.json --noEmit"`, `"typecheck:docs": "tsc -p docs/guide/snippets/tsconfig.json --noEmit"`, `"site:build": "vite build --config site/vite.config.ts"`, `"visuals": "node scripts/render-visuals.mjs"`, `"brand": "node scripts/build-brand.mjs"`, `"docs:check": "node scripts/check-docs.mjs"`. In ci.sh: typechecks + `docs:check` in both modes (≈1 s each; `npm run typecheck` is 0.78 s today), `site:build` only in full mode. Measure; the baseline is already ≈11 s (not 8 s) in rehearsal, so the planner should decide whether to keep site:build in the local gate (recommended: yes, because Pages deploys post-push and a local break would otherwise surface late) and drop it if > +4 s.
- ESLint (`eslint.config.js`): add `'site/dist/**'` (and any `docs/assets/**` JS) to `ignores`. **Required:** `.mjs` scripts currently get `no-undef` errors for `process`/`console` (verified in rehearsal: `'console' is not defined`, `'process' is not defined`) because `globals.node` is only attached to `**/*.{ts,tsx}`. Add a block `{ files: ['**/*.mjs'], languageOptions: { globals: { ...globals.node } } }`. Non-type-aware config, so site/snippet `.tsx` files lint with no tsconfig plumbing.
- `.gitignore`: add `site/dist/`.

## Guide code correctness (Q8, D-16)

1. Put every code example in `docs/guide/snippets/*.tsx` with `// #region name … // #endregion` markers; imports written exactly as users write them (`from 'lumagrid'`, `'lumagrid/viz'`).
2. `docs/guide/snippets/tsconfig.json`: extends `../../../tsconfig.json`, `noEmit`, `paths` mapping `lumagrid` → `../../../src/...` (copy of examples/tsconfig). Included in ci via `typecheck:docs`.
3. Markdown embeds each snippet as `<!-- snippet: quickstart#basic -->` + a fenced block; `scripts/check-docs.mjs` (plain Node) verifies the fence equals the region text, that relative links resolve to files, that no `vizbox` remains outside allowed files, and that each `docs/assets/charts/*` image referenced exists.
4. A vitest smoke test (`docs/guide/snippets/__tests__/snippets.test.tsx`, picked up by default `vitest run`; coverage `include` is `src/**` so thresholds are unaffected) renders the exported `Example` components with Testing Library. Needs `resolve.alias` for `lumagrid` in `vitest.config.ts`.
5. Use `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` already on in the root tsconfig, so snippets honor consumer-strict settings.
Note the **existing README snippets** (e.g. `import { createD3Plugin, … } from 'vizbox'`, `RechartsTheme.gridColor`) have never been compiled; expect fixes when snippets are first typechecked. d3 snippet needs `d3` installed.

## Pages workflow (Q6, D-11)

Verified via `gh api repos/actions/<name>/git/ref/tags/<tag>` (all lightweight tags → commit SHAs) on 2026-11-07:

| Action | Latest tag | Full commit SHA |
|--------|-----------|-----------------|
| actions/checkout | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| actions/configure-pages | v6.0.0 | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| actions/upload-pages-artifact | v5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| actions/deploy-pages | v5.0.1 | `368f82528645a54fb793d4d04e342629a3f51346` |

(`ci.yml` currently uses `actions/checkout@v4` tag pins; pages.yml uses SHAs per D-11. Leave ci.yml alone or SHA-pin it in the same pass: planner's call.) deploy-pages and setup-node run on `node24` action runtime.
```yaml
name: Pages
on:
  push:
    branches: [main]
    paths: ['site/**', 'brand/**', 'docs/**', 'src/**', 'examples/shared/**', 'typedoc.json', 'package-lock.json', '.github/workflows/pages.yml']
  workflow_dispatch:
concurrency: { group: pages, cancel-in-progress: false }
permissions: { contents: read }
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with: { persist-credentials: false }
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with: { node-version: 22, cache: npm }
      - run: npm ci --no-audit --no-fund
      - run: npm run docs:api                  # typedoc -> docs/api
      - run: npm run site:build                # vite build -> site/dist (emptyOutDir)
      - run: cp -r docs/api site/dist/api      # AFTER the site build, or emptyOutDir wipes it
      - uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0
      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0
        with: { path: site/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions: { pages: write, id-token: write }
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    steps:
      - id: deployment
        uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1
```
Hardening notes (skill `hardening-ci-workflows`): job-level `permissions` (build read-only; deploy gets only `pages: write`, `id-token: write`); no `pull_request` trigger so no fork secrets exposure; `persist-credentials: false`; concurrency without cancel so an in-flight deploy isn't killed. Node 22 on the runner (Vite 5 supports ≥18/20; local is Node 26.8.1, npm 11.19). Do not run Playwright here. Typedoc has `treatWarningsAsErrors: true`, so a TSDoc break fails the deploy (that is desired). The site's "docs/API" links: API at relative `./api/` (served `/lumagrid/api/`); the guide links to the rendered markdown on GitHub (`https://github.com/bsommers/lumagrid/blob/main/docs/guide/README.md`), avoiding a markdown renderer in the site. Pages must be enabled (Settings → Pages → Source: GitHub Actions) by a human **before** the first run; `configure-pages` fails fast otherwise. Order the checkpoints: rename repo → set-url → enable Pages → push.

## Contrast and tokens (Q9)

WCAG 2.x relative-luminance ratios computed in this session (python, formula in tests below):

| Foreground | on `#000` | on `#05070A` | on `#0B0F14` (card) |
|-----------|-----------|--------------|---------------------|
| `#00E5FF` cyan | 13.65 | 13.11 | 12.49 |
| `#7DF9FF` cyan light | 16.87 | 16.20 | 15.44 |
| `#FF2BD6` magenta | 6.57 | 6.31 | 6.01 |
| `#E6EDF3` primary text | 17.77 | 17.07 | 16.27 |
| `#C9D1D9` body | 13.61 | 13.07 | 12.45 |
| `#9AA4B2` muted | 8.33 | 8.00 | 7.62 |
| `#8B949E` | 6.83 | 6.56 | 6.25 |
| `#6E7681` | 4.57 | **4.39 (fails AA text)** | 4.18 (fails) |
| `#5C6773` | 3.64 | 3.50 | fails text |

All three D-07 hues pass AA for normal text (≥ 4.5) and for UI components (≥ 3). Body `#C9D1D9`/muted `#9AA4B2` are safe; **avoid `#6E7681` and darker for text** on `#05070A`. Buttons: use **black text on cyan (13.65) or magenta (6.57)**; white on `#FF2BD6` is only 3.20 and fails. Dim lattice/grid lines are decorative (exempt) but keep any grid line that carries meaning ≥ 3:1. The chart categorical palette on the neon site theme needs ≥ 3:1 per series against `#05070A`; verify in the same test.

Token file: `brand/tokens.css` (`--lg-bg`, `--lg-bg-card`, `--lg-cyan`, `--lg-cyan-light`, `--lg-magenta`, `--lg-text`, `--lg-muted`, `--lg-border`, `--lg-font-display/body/mono`) imported by the site; `site/src/theme/lumagridTheme.ts` mirrors the values (TS constants as the single source for the chart theme, with a vitest test asserting `tokens.css` and TS agree).

## Common Pitfalls

### Pitfall 1: API report check red after rename
**What goes wrong:** `api:check` fails ("changed the API signature") or "report missing". **Why:** report line 1 embeds the package name; configs point to new filenames. **Avoid:** `git mv` reports, edit configs, run `npm run api:update`, commit both. **Sign:** ci.sh stops at "api report".

### Pitfall 2: ci.sh reinstalls after lockfile edit
`package-lock.json -nt node_modules/.package-lock.json` is true right after editing the lock, so the next `ci.sh` runs `npm ci` (network, ~seconds). Expected, not a bug; never do this on a symlinked `node_modules`.

### Pitfall 3: Missing `xmlns` in extracted SVG
Use `XMLSerializer`. Also strip nothing else; styles are inline.

### Pitfall 4: Non-deterministic captures
Fonts not loaded (`document.fonts.ready`), device scale factor differences, ForceGraph `seed` not passed (default `1`, but pass it explicitly), different Chromium builds, animations running (site grid must be absent from capture.html and `reducedMotion:'reduce'` set).

### Pitfall 5: `.mjs` scripts fail lint
Add the `**/*.mjs` globals block (verified failure otherwise).

### Pitfall 6: Choropleth/force-graph demo surprises
Choropleth renders a placeholder text ("N features loaded") without `projectedPaths`; ForceGraph rows with a `source` column are edges, others nodes, and node `circle`s appear after an effect pass (tests use `waitFor`); wait for a stable selector before capturing.

### Pitfall 7: Adapter demo deps absent
`d3`, `recharts`, `@nivo/bar` are not installed. `createNivoPlugin` requires a `dataAdapter`; the `RechartsTheme` has `gridColor/textColor/background` (README's `theme.gridColor` is valid); `theme` passed to Nivo's `theme` prop must be the `NivoTheme` shape. Lazy-load these chunks to keep the hero fast.

### Pitfall 8: Pages path/`base` mismatch
Before the repo rename the URL would be `/uitoolbox/`; do not deploy before rename. `base: '/lumagrid/'` + root-relative asset URLs: use `import.meta.env.BASE_URL` or relative `./` links in `index.html` for favicon/manifest (`site.webmanifest` `start_url` and icon `src` relative).

### Pitfall 9: Mixed doc truth
README (363 lines) currently holds the whole manual, with a hand-drawn ASCII architecture box. Move reference content to `docs/guide/` and shrink README to banner + install + ~10-line quickstart + image strip + links (skill: backlink `[← Project README](../../README.md)` and TOC in each guide page; entry point `docs/guide/README.md`).

## Code Examples

### WCAG contrast test (vitest; also used by Validation)
```ts
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};
// expect(contrast('#00E5FF', '#05070A')).toBeGreaterThanOrEqual(4.5)  // 13.11
```

### Role-field usage (from real API; `NativeChartProps` in `src/registry/native-plugin.tsx`)
```tsx
// valueField/labelField/idField/colorField are the role props; xField/yField are @deprecated (removed in 2.0)
registerPlugin(nativeBarPlugin);
<ViewSwitcher views={[{ id: 'bar', label: 'Bar', config: { valueField: 'revenue', labelField: 'region' } }]} data={data} width={w} height={h} />
```
(`ViewSpec` [VERIFIED: src/registry/types.ts:52-59]: `export interface ViewSpec<TConfig = Record<string, unknown>> { id: string; config?: TConfig; label?: string; }`, with `id` = "Registered plugin id".) Plugin ids: `table`, `bar`, `line`, `pie`, `choropleth`, `force-graph`, `tree` (verbatim from `src/viz/plugins.ts`).

### Breaking-change CHANGELOG entry (D-01)
```md
### Changed
- **BREAKING:** the package is renamed from `vizbox` to `lumagrid`. Entry points are now `lumagrid`, `lumagrid/transforms`, `lumagrid/theme`, `lumagrid/viz` and `lumagrid/plugins`. There is no `vizbox` alias. The console warning prefix is `[lumagrid]`.
```

## State of the Art

| Old | Current | Impact |
|-----|---------|--------|
| `playwright` meta-package + `playwright install` | `playwright-core` + `executablePath`/`channel` | lighter, no browser download unless wanted |
| gh-pages branch deploys | `upload-pages-artifact` + `deploy-pages` (OIDC) | no deploy branch; needs `pages: write`, `id-token: write` |
| Tag-pinned actions (`@v4`) | Full commit SHA pins | D-11 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Favicon stroke/size choices (e.g. 4-unit strokes at viewBox 64, simplified 16 px variant) will look right | Pattern 5 | Needs visual check at 16 px; adjust art |
| A3 | Node 22 is acceptable on the Pages runner for Vite 5.4.21 + typedoc 0.28.20 | Pages workflow | Build fails; switch to 20/24 |
| A4 | Leaving `.ontology/` uncontested is acceptable (not in D-03) | Runtime State | Stale `uitoolbox` IRI; ask owner |
| A5 | Playwright-bundled Chromium (rev 1248 for 1.64.1) would produce pixel-identical captures to system Chrome 156 | Pattern 2 | Committed images churn when regenerated on another machine; mitigated by "regenerate on demand only" |
| A6 | `upload-pages-artifact` v5 excludes hidden files (dotfiles) as v4 did; irrelevant unless site ships a dotfile | Pages workflow | `.nojekyll` not needed for artifact deploys; low risk |

## Open Questions

1. **Playwright browser source:** is it OK to depend on system Chrome (`/usr/bin/google-chrome`) with env override, or should `npm run visuals` require the Playwright-managed Chromium (`npx playwright-core install chromium`, ~150 MB download, a checkpoint)? Recommendation: support both, document the managed one for reproducibility.
2. **`.ontology/` rename** (see A4).
3. **Guide hosting:** link to GitHub-rendered markdown (recommended) vs. render markdown inside the site.
4. **ci.sh budget:** the baseline is ≈11 s now; D-15 says ≈8 s. Decide whether adding site build keeps the gate acceptable.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / npm | everything | ✓ | 26.8.1 / 11.19.0 | — |
| Vite | site | ✓ (transitive) | 5.4.21 | — |
| Google Chrome | visuals/brand raster | ✓ | 156.0.8078.79 (`/usr/bin/google-chrome`) | Playwright Chromium cache present for revs 1134/1181/1234 only; 1.64.1 needs rev 1248 download |
| Inkscape / ImageMagick | optional cross-check (`identify`) | ✓ | `/usr/bin/inkscape`, `/usr/bin/magick` | not required |
| Python fonttools | — | ✗ | — | opentype.js |
| gh CLI | action SHAs, rename | ✓ (authed) | — | — |
| GitHub Pages | deploy | ✗ (404) | — | human enables |
| Network to npm | installs | ✓ | — | — |

## Validation Architecture

Config: `.planning/config.json` → `workflow.nyquist_validation: true`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest `^1.6.0` + jsdom + Testing Library (existing), coverage v8 |
| Config file | `vitest.config.ts`, `vitest.setup.ts` |
| Quick run command | `bash scripts/ci.sh --fast` (typecheck, lint, tests) |
| Full suite command | `bash scripts/ci.sh` |

### Phase Requirements → Test Map (D-IDs)
| ID | Behavior | Type | Automated Command | Exists? |
|----|----------|------|-------------------|---------|
| D-01/D-03/D-05 | No stale `vizbox`; package/subpath names; `[lumagrid]` prefix | grep + unit | `! git grep -il vizbox -- . ':!.planning' ':!plans' ':!REBUILD.md' ':!docs/superpowers' ':!.security-reports' ':!CHANGELOG.md' ':!.claude'`; `! git grep -n '\[uitoolbox\]' src`; `npx vitest run src/__tests__/barrels.test.ts` | barrels test ✅ (rename), grep ❌ Wave 0 (put in `scripts/check-docs.mjs`) |
| D-03 | API reports regenerated & match | gate | `npm run api:check` (inside ci.sh) | ✅ |
| D-04 | Historical docs carry the note | grep | `for f in plans/*.md REBUILD.md .security-reports/*.md docs/superpowers/*/*.md; do head -3 "$f" \| grep -q 'Historical document'; done` | ❌ Wave 0 (check-docs) |
| D-06 | Mark geometry integer-aligned and symmetric | unit | `npx vitest run brand/__tests__/mark.test.ts` (parse `brand/mark.svg`: every coordinate integer; each `x` has mirror `64 − x`) | ❌ Wave 0 |
| D-06 | 16 px legibility | manual-only (human views `favicon-16.png`) | `node scripts/build-brand.mjs` then open image | justification: perceptual |
| D-07 | Contrast AA | unit | `npx vitest run site/src/__tests__/tokens.test.ts` (formula above; text ≥ 4.5, graphics ≥ 3; tokens.css ↔ TS agree) | ❌ Wave 0 |
| D-08 | Wordmark has no `<text>`/font dependency | grep | `! grep -l '<text\|font-family' brand/wordmark.svg brand/lockup.svg` | ❌ Wave 0 |
| D-09 | All icon files exist with right dimensions; ICO has 16+32 | script | `node scripts/build-brand.mjs && node scripts/check-brand.mjs` (reads PNG IHDR for sizes; parses ICONDIR; checks manifest JSON) or `identify` locally | ❌ Wave 0 |
| D-10/D-12 | Site builds, all 7 charts + 3 adapters register and render | unit+build | `npm run typecheck:site && npm run site:build`; vitest render test of gallery (`site/src/__tests__/gallery.test.tsx`) | ❌ Wave 0 |
| D-11 | Workflow pinned/min-permissions | grep/lint | `grep -E 'uses: .*@[0-9a-f]{40}' .github/workflows/pages.yml` for every `uses:`; `grep -c 'permissions' …`; (optional `actionlint` if available) | ❌ Wave 0 |
| D-13 | Reduced-motion disables animation; no horizontal scroll | unit/manual | CSS string test (`@media (prefers-reduced-motion: reduce)` sets `animation: none`); Playwright (local) check `document.documentElement.scrollWidth <= innerWidth` at 375 px, run inside `visuals` as an assertion | ❌ Wave 0 |
| D-14/D-15 | Visuals produce 14 PNG + 10 SVG; ci.sh has no Playwright | script + grep | `npm run visuals && node scripts/check-visuals.mjs` (counts, SVG parses with `xmlns`); `! grep -i playwright scripts/ci.sh` | ❌ Wave 0 |
| D-16 | Guide snippets compile and match docs | gate | `npm run typecheck:docs && node scripts/check-docs.mjs && npx vitest run docs/guide` | ❌ Wave 0 |
| D-17 | Mermaid renders | manual-only (GitHub preview) | justification: no renderer dependency allowed | — |
| D-02/D-11 | Repo renamed, Pages live | manual (human checkpoint) | `gh repo view bsommers/lumagrid --json url`; `curl -sI https://bsommers.github.io/lumagrid/ \| head -1` | — |

### Sampling Rate
- **Per task commit:** `bash scripts/ci.sh --fast` plus the task's specific command above.
- **Per wave merge:** `bash scripts/ci.sh` (full) and `node scripts/check-docs.mjs`.
- **Phase gate:** full ci.sh green, `npm run visuals` run once and outputs committed and `check-visuals` green, after human checkpoints `curl` the live site.

### Wave 0 Gaps
- [ ] `scripts/check-docs.mjs`, `scripts/check-brand.mjs`, `scripts/check-visuals.mjs`
- [ ] `brand/__tests__/mark.test.ts`, `site/src/__tests__/{tokens,gallery}.test.tsx`, `docs/guide/snippets/__tests__/snippets.test.tsx`
- [ ] vitest alias for `lumagrid` in `vitest.config.ts`; eslint `.mjs` globals block; `.gitignore` `site/dist/`
- [ ] Framework install: none (vitest present); Playwright/fonts/demo libs via approved install task

## Security Domain

`security_enforcement` is not set to false → included.

### Applicable ASVS Categories
| ASVS Category | Applies | Control |
|---------------|---------|---------|
| V2/V3/V4 auth, session, access | no (static public site, no accounts) | — |
| V5 Input validation | minimal | `capture.html` query params must be matched against an allow-list (chart/theme names); never inject into HTML |
| V6 Cryptography | no | — |
| V14 Config / supply chain | yes | exact-pinned devDeps, SHA-pinned actions, legitimacy audit, minimal `permissions` |

### Known Threat Patterns
| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Compromised/typosquatted dependency | Tampering | Package audit above; human-verify on `playwright-core`, `d3` flags; exact pins |
| Mutable action tags | Tampering | Full-SHA pins (table above) |
| Over-privileged workflow token | Elevation | Job-level least privilege; no PR trigger |
| XSS via query param in capture page | Tampering | allow-list parameters; React renders text (no `dangerouslySetInnerHTML`) |
| SVG injection in extracted/committed SVG | Tampering | SVGs are generated from the library's own output; no scripts; reviewed in diff |
| Third-party font/CDN leakage | Info disclosure | Self-hosted fontsource |

## Sources

### Primary (HIGH)
- Local files read this session: `package.json`, `scripts/ci.sh`, `scripts/api.sh`, `typedoc.json`, `etc/api-extractor.base.json` and per-entry configs, `examples/{vite.config.ts,tsconfig.json,index.html,src/main.tsx}`, `.github/workflows/ci.yml`, `eslint.config.js`, `vitest.config.ts`, `src/viz/*`, `src/registry/native-plugin.tsx`, `src/theme/dark.ts`, `CHANGELOG.md`, `deno.json`, `NOTICE`
- Executed: scratch-copy rename + `api:update` + `ci.sh` (pass, 11 s); Playwright 1.64.1 and 1.65.0 against system Chrome 156; ICO writer + ImageMagick `identify`; opentype.js 2.0.0 on Orbitron variable TTF and fontsource woff; eslint on a `.mjs`; contrast calculations
- npm registry (`npm view`): playwright-core 1.65.0/1.64.1 (+ publish dates), @playwright/test 1.65.0, vite 8.3.6, d3 7.9.2, recharts 3.10.1, @nivo/bar 0.99.0, @fontsource-variable/* 5.3.0, opentype.js 2.0.0, sharp 0.35.5, @resvg/resvg-js 2.6.2, png-to-ico 3.0.2; `npm view lumagrid` → 404 (name free)
- GitHub API: tag→SHA for the five `actions/*` repos; `bsommers/uitoolbox` is PUBLIC, Pages 404
- `raw.githubusercontent.com/google/fonts/main/ofl/orbitron/OFL.txt`, `github.com/google/fonts/ofl/orbitron` listing

### Secondary / Tertiary
- None relied on; Mermaid rendering on GitHub and Pages UI steps are from general knowledge (flagged manual).

## Metadata

**Confidence breakdown:**
- Rename + api-extractor: HIGH (rehearsed to green)
- Playwright/raster/ICO/SVG extraction: HIGH (executed)
- Pages workflow: HIGH for SHAs/permissions, MEDIUM for first-run behavior (Pages not enabled yet)
- Logo grid craft, UX: MEDIUM (design judgment)
- Guide snippet pipeline: MEDIUM (design proposal, small scripts to write)

**Research date:** 2026-11-07
**Valid until:** 2026-11-21 (Playwright and action versions move quickly; re-run `gh api …/git/ref/tags/<tag>` and `npm view` before pinning)
