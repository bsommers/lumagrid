[← Back to Project README](../../README.md)

# Lumagrid user guide

The guide takes you from installing the library to writing your own chart plugins. Every code example in it lives in a real, type-checked file under `docs/guide/snippets/` and is copied into the page unchanged, so what you read is what compiles.

## Contents

- [Reading order](#reading-order)
- [Reference documents](#reference-documents)

## Reading order

1. [Getting started](./getting-started.md): install, draw a first chart, learn the data model and the role field names.
2. [Transforms](./transforms.md): reshape raw data with `flatten`, `aggregate`, `pivot`, `groupBy` and `geoNormalize`.
3. [Theming](./theming.md): `ThemeProvider`, `ThemeDefinition` and the color scale helpers.
4. [Plugins and adapters](./plugins-and-adapters.md): the `ChartPlugin` contract, the registry, custom plugins, and the D3, Recharts and Nivo adapters.
5. [Troubleshooting](./troubleshooting.md): symptoms, causes and fixes for the problems readers hit most.

## Reference documents

- [Architecture](../ARCHITECTURE.md): how the layers, entry points and build outputs fit together.
- [Using and configuring](../USING.md): prerequisites, install, entry points, npm scripts and environment variables.
- [Purpose](../PURPOSE.md): what Lumagrid is for and the problems it solves.
- [Stability](../STABILITY.md): which exports are stable, which are experimental, and how field props resolve.
