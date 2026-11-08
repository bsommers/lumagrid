[← Back to Project README](../../README.md)

# Lumagrid user guide

The guide takes you from installing the library to writing your own chart plugins. Every code example in it lives in a real, type-checked file under `docs/guide/snippets/` and is copied into the page unchanged, so what you read is what compiles.

## Contents

- [Reading order](#reading-order)
- [Charts](#charts)
- [Reference documents](#reference-documents)

## Reading order

1. [Getting started](./getting-started.md): install, draw a first chart, learn the data model and the role field names.
2. [Transforms](./transforms.md): reshape raw data with `flatten`, `aggregate`, `pivot`, `groupBy` and `geoNormalize`.
3. [Theming](./theming.md): `ThemeProvider`, `ThemeDefinition` and the color scale helpers.
4. [Plugins and adapters](./plugins-and-adapters.md): the `ChartPlugin` contract, the registry, custom plugins, and the D3, Recharts and Nivo adapters.
5. [Troubleshooting](./troubleshooting.md): symptoms, causes and fixes for the problems readers hit most.

## Charts

One page per native chart, each with its data shape, props, a verified example and the rendered light and dark images. Start at the [charts index](./charts/README.md).

- [Bar chart](./charts/bar-chart.md)
- [Line chart](./charts/line-chart.md)
- [Pie chart](./charts/pie-chart.md)
- [Force graph](./charts/force-graph.md)
- [Choropleth](./charts/choropleth.md)
- [Data table](./charts/data-table.md)
- [Tree view](./charts/tree-view.md)

## Reference documents

- [Architecture](../ARCHITECTURE.md): how the layers, entry points and build outputs fit together.
- [Using and configuring](../USING.md): prerequisites, install, entry points, npm scripts and environment variables.
- [Purpose](../PURPOSE.md): what Lumagrid is for and the problems it solves.
- [Stability](../STABILITY.md): which exports are stable, which are experimental, and how field props resolve.
