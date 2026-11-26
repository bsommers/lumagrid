# Checkpoint: network graph integrations (2026-11-25)

## State
- `main` and tag `v0.2.0` are pushed to origin (HEAD `53ec032`, "chore(release): 0.2.0"). Not published to npm.
- Local branch `feat/network-graphs` is merged and can be deleted. No worktrees remain (`/datanapps/worktrees/lumagrid-*` removed). Working tree clean except this file.
- `scripts/ci.sh` passes (918 tests, coverage gate, build, smoke, strict API report).

## Delivered (all `@beta @experimental`)
- M0: `toGraph` (lumagrid/transforms), `graphThemeAdapter` + `GraphEvents` (lumagrid/plugins), `graphSampleData` (lumagrid/testing).
- M1: `createReagraphPlugin`. M2: `createForceGraphPlugin` (Renderer applies colors via `themeRfgData`, since `dataAdapter` gets no theme).
- M3: `lumagrid/r3f` (`layoutGraph3D`, `useForceLayout3D`, `InstancedNodes`, `EdgeLines`, `NodeLabels`, `CameraRig`, `createR3FGraphPlugin`). Fiber 8 / drei 9 for React 18.
- M4: guides `docs/guide/network-graphs.md`, `r3f.md`, site demos (lazy), examples "Module network", CHANGELOG 0.2.0.
- Plan doc: `docs/superpowers/plans/network-graph-integrations.md`; roadmap section "Milestone v1.1" in `.planning/ROADMAP.md` (boxes not ticked).

## Open
- WebGL screenshots (`npm run visuals`) never attempted; site agent skipped them.
- npm publish of 0.2.0 not done (user has not asked).
- R3F guide wording "drei release that targets fiber v9" is unverified.
- ROADMAP v1.1 checkboxes still unchecked.

## Gotchas
- `npm ci` fails (peer conflicts); use `npm ci --legacy-peer-deps`. `scripts/ci.sh` re-runs plain `npm ci` when the lockfile is newer than `node_modules`; `touch node_modules/.package-lock.json` first.
- Never symlink `node_modules` into a worktree and commit it; a tracked symlink clobbered the real directory on merge once. `.gitignore` now has `node_modules` (no slash).
- Build output and worktrees go under `/datanapps`, never `/tmp`.

## Next command
Whatever the user asks next; likely `npm publish --tag next` (confirm first) or `npm run visuals` for screenshots.
