[← Project README](../../README.md)

# Theming

Give every widget one look with `ThemeProvider`, describe that look with a `ThemeDefinition`, and draw from its palettes with the color scale helpers.

## Contents

- [ThemeProvider and the shorthands](#themeprovider-and-the-shorthands)
- [The ThemeDefinition tokens](#the-themedefinition-tokens)
- [A custom theme](#a-custom-theme)
- [How charts receive the theme](#how-charts-receive-the-theme)
- [Color scale helpers](#color-scale-helpers)
- [Brand tokens are separate](#brand-tokens-are-separate)

## ThemeProvider and the shorthands

`ThemeProvider` makes a theme available to everything below it. Its `theme` prop is either a shorthand string or a full `ThemeDefinition` object:

| Value | Result |
|-------|--------|
| `'light'` | the built-in `lightTheme` |
| `'dark'` | the built-in `darkTheme` |
| a `ThemeDefinition` object | that theme, used as given |

`useTheme()` returns the theme of the nearest provider. Without any provider it returns `lightTheme`, so widgets work unthemed. `WidgetContainer` and `ViewSwitcher` read the theme this way for their own chrome (background, border, tab strip, text).

`lightTheme`, `darkTheme` and the types are exported from `lumagrid` and from `lumagrid/theme`.

## The ThemeDefinition tokens

A `ThemeDefinition` has a `name` and five token groups.

| Group | Tokens | Notes |
|-------|--------|-------|
| `colors` | `categorical`, `sequential`, `diverging` | Arrays of color strings. The documented minimums are 8 categorical colors, 5 sequential stops, and 5 diverging stops (an odd count, so the scale has a midpoint). |
| `typography` | `fontFamily`, `fontSizeBase`, `fontSizeSm`, `fontSizeLg`, `fontWeightNormal`, `fontWeightBold`, `lineHeight` | Sizes are CSS strings such as `'14px'`; weights and `lineHeight` are numbers. |
| `spacing` | `base`, `xs`, `sm`, `md`, `lg`, `xl` | `base` is the unit in pixels as a number, and the others are CSS strings that are multiples of it. |
| `surface` | `background`, `surface`, `border`, `borderRadius`, `shadowSm`, `shadowMd` | Container, tab strip and card styling. |
| `text` | `primary`, `secondary`, `disabled`, `inverse` | Text colors. `inverse` is for text drawn on top of a colored mark, such as the value inside a bar. |

The library does not validate these minimums when it receives a theme, so keep to them yourself.

## A custom theme

A theme is a plain object, so the easiest way to make one is to spread a built-in theme and override only what differs. The example renders two providers side by side, one with the `'light'` shorthand and one with the custom object, each wrapping a child that reads its theme with `useTheme`.

<!-- snippet: theming#custom-theme -->

```tsx
import { ThemeProvider, useTheme, darkTheme, HorizontalBarChart } from 'lumagrid';
import type { ThemeDefinition, TransformedData } from 'lumagrid';

// A theme is a plain object. Spread a built-in theme and override only what differs.
export const brandTheme: ThemeDefinition = {
  ...darkTheme,
  name: 'brand',
  colors: {
    ...darkTheme.colors,
    categorical: [
      '#22d3ee', '#a78bfa', '#f472b6', '#facc15',
      '#34d399', '#fb923c', '#60a5fa', '#f87171',
    ],
  },
  surface: { ...darkTheme.surface, background: '#0b0f14' },
};

const sales: TransformedData = {
  rows: [
    { region: 'North', revenue: 12000 },
    { region: 'South', revenue: 14200 },
    { region: 'East', revenue: 9300 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'revenue', type: 'number' },
  ],
};

// Native charts take the theme as a prop; useTheme reads it from the nearest ThemeProvider.
function Chart() {
  const theme = useTheme();
  return (
    <figure style={{ margin: 0 }}>
      <figcaption>Theme: {theme.name}</figcaption>
      <HorizontalBarChart
        data={sales}
        width={480}
        height={200}
        theme={theme}
        valueField="revenue"
        labelField="region"
      />
    </figure>
  );
}

export function Example() {
  return (
    <>
      {/* The shorthand strings are 'light' and 'dark'. */}
      <ThemeProvider theme="light">
        <Chart />
      </ThemeProvider>
      {/* Or pass a full ThemeDefinition object. */}
      <ThemeProvider theme={brandTheme}>
        <Chart />
      </ThemeProvider>
    </>
  );
}
```

Define a custom theme once, outside any component. `ThemeProvider` hands the object to its descendants as it receives it, so a theme rebuilt on every render makes every consumer render again.

## How charts receive the theme

Native charts (`HorizontalBarChart`, `LineChart`, `PieChart`, `DataTable`, `TreeView`, `Choropleth`, `ForceGraph`) take the theme as an explicit `theme` prop, as in the example above. This keeps them usable without a provider.

When a chart is drawn through `ViewSwitcher`, the switcher reads the theme from context and passes it to the plugin's `themeAdapter`. The adapter converts a `ThemeDefinition` into whatever the chart library expects, and the result reaches the plugin's `Renderer` as its `theme`. The native plugins use an identity adapter, so the charts get the `ThemeDefinition` unchanged. The D3, Recharts and Nivo adapters convert it into their own theme shapes; see [Plugins and adapters](./plugins-and-adapters.md).

## Color scale helpers

Four helpers turn a theme's palettes into colors. They are exported from `lumagrid` and from `lumagrid/theme`.

| Helper | Signature | Behavior |
|--------|-----------|----------|
| `categoricalColor` | `(theme, index)` | The categorical color at `index`, wrapping around after the last. |
| `sequentialColor` | `(theme, t)` | A color along the sequential scale. `t` is clamped to 0 through 1 and interpolated linearly between stops. |
| `divergingColor` | `(theme, t)` | A color along the diverging scale. `t` is clamped to -1 through 1, and 0 is the midpoint. |
| `thresholdScale` | `(thresholds, colors)` | Returns a function from a number to a color. `colors` must have exactly one more entry than `thresholds`, or the call throws. |

<!-- snippet: theming#color-scales -->

```tsx
import { categoricalColor, sequentialColor, divergingColor, thresholdScale } from 'lumagrid';

// Every helper reads its colors from the theme you pass in (brandTheme is defined above).
export const swatches = {
  // Series 0, 1, 2 ... wrapping around after the last categorical color.
  series: [0, 1, 9].map((index) => categoricalColor(brandTheme, index)),
  // t runs from 0 (first stop) to 1 (last stop) and is interpolated between stops.
  sequentialEnds: [sequentialColor(brandTheme, 0), sequentialColor(brandTheme, 1)],
  // t runs from -1 through 0 (the midpoint) to 1.
  divergingMid: divergingColor(brandTheme, 0),
};

// Two thresholds make three bands: below 50, from 50 to below 80, and 80 or more.
export const grade = thresholdScale([50, 80], ['#f87171', '#facc15', '#34d399']);
```

Details worth knowing:

- Index 9 wraps to index 1 in an eight-color palette, so `swatches.series` is the first, second and second colors.
- `sequentialColor` and `divergingColor` always return an `rgb(r,g,b)` string, even when `t` lands exactly on a stop. For `brandTheme`, `sequentialColor(brandTheme, 0)` is `rgb(8,48,107)`, `sequentialColor(brandTheme, 1)` is `rgb(222,235,247)` and `divergingColor(brandTheme, 0)` is `rgb(254,224,144)`.
- The stops of the sequential and diverging palettes must be hex colors (`#rgb` or `#rrggbb`), because the interpolation parses them. Named colors and `rgb()` strings are not supported there.
- `thresholdScale` compares with a strict less-than, so a value equal to a threshold belongs to the band above it: `grade(49)` is red, and `grade(50)` is yellow.

## Brand tokens are separate

The Lumagrid brand palette (the neon colors on the project site and in the diagrams) lives in `brand/tokens.css` in the repository and is not a library theme. `lightTheme`, `darkTheme` and any theme you write are independent of it, and the library itself ships no brand styling.

Continue with [Plugins and adapters](./plugins-and-adapters.md), or go back to [Getting started](./getting-started.md).
