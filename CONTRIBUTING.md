# Contributing

## Testing conventions

**The plugin registry is a single shared module-level `Map` — tests that call `registerPlugin` must reset it.** `src/registry/index.ts` holds one `Map` for the lifetime of the test process, not one per test file or per test. If two tests (in the same file or different files run in the same worker) register a plugin under the same `id`, the second registration replaces the first and, outside production, logs a `console.warn`. A test can still end up exercising a plugin left behind by an earlier test instead of the one it just registered.

Any test file that calls `registerPlugin` must call `__resetRegistryForTests()` (imported directly from `../../registry/index.js`, not from a barrel — it is deliberately not re-exported from `core/index.ts` or the top-level `lumagrid` package) in a `beforeEach`:

```ts
import { registerPlugin, __resetRegistryForTests } from '../../registry/index.js';

beforeEach(() => {
  __resetRegistryForTests();
});
```

This is why plugin `id`s across the test suite don't need to be globally unique — the reset, not the naming, is what removes the fragility. See `src/registry/__tests__/index.test.ts`, `src/core/__tests__/view-switcher.test.tsx`, and `src/core/__tests__/view-switcher-adapters.test.tsx` for the pattern in practice.

## Local CI (primary gate)

Hosted GitHub Actions CI is disabled for this repo to save minutes; checks run locally.

```bash
git config core.hooksPath .githooks   # once per clone: runs scripts/ci.sh before every push
scripts/ci.sh                         # typecheck, lint, tests + coverage gate, build, API report check, examples build (~10s)
scripts/ci.sh --fast                  # typecheck, lint, tests only
git push --no-verify                  # skip the hook once (avoid)
```

After an intentional public API change, run `npm run api:update` and commit the updated reports under `etc/`. `scripts/ci.sh` fails until they match the build. See [docs/STABILITY.md](docs/STABILITY.md#how-the-surface-is-guarded).

`.github/workflows/ci.yml` is a minimal backstop (PRs and manual dispatch only, one job, 10-minute cap) that just runs `scripts/ci.sh`. Keep the two in step.

## Docs, brand and site

- **Snippets.** Guide code lives in `docs/guide/snippets/*.tsx`, with `// #region name` and `// #endregion` markers around each excerpt. A markdown page embeds an excerpt with a `<!-- snippet: file#region -->` marker followed by a fenced block that copies the region unchanged. `npm run docs:check` fails when a block drifts from its source, when a retired name appears outside the historical allowlist, or when an image is missing or remote.
- **Type checks.** `npm run typecheck:site` type-checks the site and the snippets. `scripts/ci.sh` runs it, so a broken example fails the local gate.
- **Chart images.** `npm run visuals` regenerates `docs/assets/charts` and needs a Chrome or Chromium. Set `LUMAGRID_CHROME` to the binary path to override the lookup. `npm run visuals:check` validates the committed files and needs no browser.
- **Brand assets.** `npm run brand` regenerates the icon and art PNGs and ICO files from the SVG sources under `brand/`. `npm run brand:check` validates them. Generated PNG and ICO files are never edited by hand; change the SVG source and regenerate.
- **Site.** `npm run site:dev` serves the showcase site, `npm run site:build` builds it and `npm run site:preview` serves the build.
- **What the gate skips.** The local gate never runs the visuals or the site build. They run on demand and in the Pages workflow.
