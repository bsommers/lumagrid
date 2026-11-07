# Contributing

## Testing conventions

**The plugin registry is a single shared module-level `Map` — tests that call `registerPlugin` must reset it.** `src/registry/index.ts` holds one `Map` for the lifetime of the test process, not one per test file or per test. If two tests (in the same file or different files run in the same worker) register a plugin under the same `id`, the second registration silently overwrites the first, and a test can end up exercising a plugin left behind by an earlier test instead of the one it just registered.

Any test file that calls `registerPlugin` must call `__resetRegistryForTests()` (imported directly from `../../registry/index.js`, not from a barrel — it is deliberately not re-exported from `core/index.ts` or the top-level `vizbox` package) in a `beforeEach`:

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
scripts/ci.sh                         # typecheck, lint, tests + coverage gate, build, examples build (~10s)
scripts/ci.sh --fast                  # typecheck, lint, tests only
git push --no-verify                  # skip the hook once (avoid)
```

`.github/workflows/ci.yml` is a minimal backstop (PRs and manual dispatch only, one job, 10-minute cap) that just runs `scripts/ci.sh`. Keep the two in step.
