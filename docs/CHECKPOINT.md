# Checkpoint: lumagrid 0.2.1 (2026-11-26)

## State
- `main` at the 0.2.1 release commit; tag `v0.2.1`. `v0.2.0` is at `53ec032`. gh active account: bsommers (needed for pushes to bsommers/lumagrid).
- Delivered since 0.2.0: WebGL captures (rfg, r3f; Reagraph not capturable on React 18), `NodeLabels` `font` / plugin `labelFont`, Inter (OFL) via @fontsource/inter for site, Reagraph React 19 note and error boundary.
- `scripts/ci.sh` passes. User is logged in to npm. NOT yet published: user runs `npm publish --tag next --access public` (needs OTP).
- diagrams-as-code (/home/bill/src/ai/diagrams-as-code, master): commits 10e08dd, 4d724a1, 80d0f32 local, NOT pushed (ask first).

## Gotchas
- `npm ci --legacy-peer-deps`; `touch node_modules/.package-lock.json` before ci.sh; no node_modules symlink commits; temp output under /datanapps.
