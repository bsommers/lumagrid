<p align="center">
  <img src="brand/banner.svg" alt="Lumagrid" width="720">
</p>

<p align="center"><strong>Themeable, pluggable data widgets for React</strong></p>

## What it is

Lumagrid is a layered React + TypeScript library for data visualization widgets over tabular, hierarchical, geographic and time-series data. Draw with the built-in SVG charts, or plug in your own renderer.

- Seven native chart types: bar, line, pie, data table, tree view, choropleth and force graph
- D3, Recharts and Nivo adapters that turn any of those libraries into a view
- A transform layer (`flatten`, `aggregate`, `pivot`, `groupBy`, `geoNormalize`) with no React dependency
- Light and dark themes, plus your own through `ThemeProvider`
- The `ChartPlugin` contract for writing a renderer from scratch
- Strict TypeScript types, with every export tagged `@public` or `@experimental`

## Install

```bash
npm install lumagrid react react-dom
# optional adapter peers, only for the libraries you use
npm install d3 recharts @nivo/bar
```

> **Note:** this project is pre-release and the npm package is not yet published (REL-02 is pending), so `npm install lumagrid` does not resolve yet. See [docs/RELEASE-PLAN.md](docs/RELEASE-PLAN.md).

## Quickstart

<!-- snippet: hero#hero -->

```tsx
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin, type TransformedData } from 'lumagrid';
import { nativeBarPlugin } from 'lumagrid/viz';
registerPlugin(nativeBarPlugin);
const data: TransformedData = {
  rows: [{ region: 'North', revenue: 12000 }, { region: 'South', revenue: 14200 }],
  fields: [{ key: 'region', type: 'string' }, { key: 'revenue', type: 'number' }],
};
const views = [{ id: 'bar', config: { valueField: 'revenue', labelField: 'region' } }];
export const Example = () => (
  <ThemeProvider theme="dark">
    <WidgetContainer data={data} title="Revenue" width={480} height={300}>
      {(d, w, h) => <ViewSwitcher views={views} data={d} width={w} height={h} />}
    </WidgetContainer>
  </ThemeProvider>
);
```

## Charts

| | | | |
|:-:|:-:|:-:|:-:|
| <img src="docs/assets/charts/bar-dark.png" alt="Bar chart" width="190"><br>Bar | <img src="docs/assets/charts/line-dark.png" alt="Line chart" width="190"><br>Line | <img src="docs/assets/charts/pie-dark.png" alt="Pie chart" width="190"><br>Pie | <img src="docs/assets/charts/table-dark.png" alt="Data table" width="190"><br>Data table |
| <img src="docs/assets/charts/tree-dark.png" alt="Tree view" width="190"><br>Tree view | <img src="docs/assets/charts/choropleth-dark.png" alt="Choropleth map" width="190"><br>Choropleth | <img src="docs/assets/charts/force-dark.png" alt="Force graph" width="190"><br>Force graph | |

## How it fits together

Data flows through the transform layer, a plugin turns it into a renderer's shape, and the theme layer styles the result. Each layer imports only from the layers below it.

![Pipeline: raw data, transforms, plugin registry, renderer](docs/assets/diagrams/pipeline.svg)

## Learn more

| | |
|---|---|
| Showcase site | https://bsommers.github.io/lumagrid/ |
| User guide | [docs/guide/README.md](docs/guide/README.md) |
| API reference | https://bsommers.github.io/lumagrid/api/ |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Using and configuring | [docs/USING.md](docs/USING.md) |
| Purpose | [docs/PURPOSE.md](docs/PURPOSE.md) |
| Stability | [docs/STABILITY.md](docs/STABILITY.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |

Source: https://github.com/bsommers/lumagrid

## Stability

The public API is being frozen for 1.0. The tag policy and the stable and experimental lists are in [docs/STABILITY.md](docs/STABILITY.md).

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
