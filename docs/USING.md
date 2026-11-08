[← README](../README.md)

# Using and configuring Lumagrid

Prerequisites, install, the package entry points, every npm script and the environment variable that the browser-driven scripts read.

## Contents

- [Prerequisites](#prerequisites)
- [Install](#install)
- [Entry points](#entry-points)
- [npm scripts](#npm-scripts)
- [Environment variables](#environment-variables)
- [Where to go next](#where-to-go-next)

## Prerequisites

- **React 18 or newer** and `react-dom` at the same version range. Both are peer dependencies (`>=18.0.0`).
- **Node.js** for development of this repository. `package.json` declares no `engines` field. The hosted CI backstop (`.github/workflows/ci.yml`) runs on Node 20, and the library is built with `tsc`, so any current Node release that can run `npm ci` works.
- **A Chrome or Chromium binary** only for the browser-driven scripts (`npm run visuals` and `npm run brand`). See [Environment variables](#environment-variables).

## Install

```bash
npm install lumagrid
npm install react react-dom
```

The adapter factories (`createD3Plugin`, `createRechartsPlugin`, `createNivoPlugin`) do not import the chart libraries themselves. You import the chart library in the `Renderer` you hand to the factory, so install it only when your own renderer uses it:

```bash
npm install d3          # for a D3 renderer
npm install recharts    # for a Recharts renderer
npm install @nivo/bar   # for a Nivo renderer
```

`package.json` currently marks only `d3` in `peerDependenciesMeta`. Finalising the peer dependency list is part of the publishing checklist in [RELEASE-PLAN.md](RELEASE-PLAN.md#publishing-to-npm); npm publishing is still pending.

To work on the repository itself:

```bash
npm ci
bash scripts/ci.sh   # typecheck, lint, tests with coverage, build, API report check, examples build
```

## Entry points

| Import | What it gives you |
|--------|-------------------|
| `lumagrid` | The main API: theme, transforms, registry, containers, native charts and adapter factories. |
| `lumagrid/transforms` | The transform layer on its own: `flatten`, `aggregate`, `pivot`, `groupBy`, `geoNormalize`, `TransformPipeline`. No React. |
| `lumagrid/theme` | `ThemeProvider`, `useTheme`, `lightTheme`, `darkTheme`, the `ThemeDefinition` tokens and the color scales. |
| `lumagrid/viz` | The seven native SVG charts and the `native*Plugin` presets that register them. |
| `lumagrid/plugins` | `createD3Plugin`, `createRechartsPlugin`, `createNivoPlugin` and the Recharts and Nivo theme adapters. |

How the layers fit together is in [ARCHITECTURE.md](ARCHITECTURE.md#entry-points-and-build-outputs).

## npm scripts

Run any of these with `npm run <name>` from the repository root.

| Script | What it does |
|--------|--------------|
| `build` | Compiles the library to `dist/`: ESM first, then CJS. |
| `build:esm` | Compiles the ESM build only (`tsconfig.esm.json`). |
| `build:cjs` | Compiles the CJS build only (`tsconfig.cjs.json`). |
| `typecheck` | Type-checks the library without emitting files. |
| `lint` | Runs ESLint over the repository and fails on any warning. |
| `test` | Runs the Vitest suite once. |
| `test:watch` | Runs Vitest in watch mode. |
| `test:coverage` | Runs the suite under the coverage gate (thresholds in `vitest.config.ts`). |
| `docs:api` | Generates the API reference with typedoc into `docs/api/` (gitignored). |
| `api:check` | Runs api-extractor on the built declarations and fails when a report in `etc/` is stale or an export has no release tag. Needs `build:esm` first. |
| `api:update` | Runs `build:esm`, then rewrites the API reports in `etc/`. Use it after an intentional public API change. |
| `examples:dev` | Starts the examples app with the Vite dev server. |
| `examples:build` | Builds the examples app. |
| `site:dev` | Starts the showcase site with the Vite dev server. |
| `site:build` | Builds the showcase site. |
| `site:preview` | Serves the built showcase site locally. |
| `typecheck:site` | Type-checks the showcase site and the guide code snippets. |
| `docs:check` | Validates the documentation: relative links and images, embedded code snippets, stale names and historical-document notes. |
| `visuals` | Renders each chart in headless Chrome and writes PNG and SVG files, in light and dark themes, to `docs/assets/charts/`. Needs a browser. |
| `visuals:check` | Checks that the committed chart visuals exist and are valid. |
| `brand` | Regenerates the brand icon and art files from the SVG sources in `brand/`. Needs a browser for the PNG output. |
| `brand:check` | Checks that the generated brand files exist and match their expected dimensions. |

Two shell scripts sit behind these: `scripts/ci.sh` (the local gate, run `scripts/ci.sh --fast` for typecheck, lint and tests only) and `scripts/api.sh` (`check`, `update` and `parity`, used by the `api:*` scripts). The local gate never runs the visuals, the brand build or the site build. See [CONTRIBUTING.md](../CONTRIBUTING.md#local-ci-primary-gate).

## Environment variables

| Variable | Read by | Meaning |
|----------|---------|---------|
| `LUMAGRID_CHROME` | `npm run visuals`, `npm run brand` (through `scripts/lib/browser.mjs`) | Absolute path to a Chrome or Chromium executable to use for headless rendering. |

The shared launcher in `scripts/lib/browser.mjs` resolves a browser in this order and uses the first that exists:

1. `LUMAGRID_CHROME`. If it is set but the file does not exist, the script stops with an error instead of falling through to the next option.
2. The Chromium that `playwright-core` manages, if you already installed it.
3. `/usr/bin/google-chrome`.

If none is found, the script prints the three places it tried. The scripts never download a browser for you and launch it with the sandbox left enabled. To check your setup:

```bash
LUMAGRID_CHROME=/path/to/chrome node scripts/lib/browser.mjs --smoke
```

It opens the browser, takes a screenshot and prints `PNG ok` when the screenshot is a valid PNG.

## Where to go next

- [User guide](guide/README.md) for task walkthroughs.
- [Getting started](guide/getting-started.md) for a first widget.
- [Troubleshooting](guide/troubleshooting.md) when something does not render.
- [Architecture](ARCHITECTURE.md) and [Purpose](PURPOSE.md).
