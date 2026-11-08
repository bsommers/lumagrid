// Source of the theming chapter. Compiled by `npm run typecheck:site`,
// rendered and asserted by __tests__/snippets.test.tsx, embedded verbatim in the markdown.

// #region custom-theme
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
// #endregion

// #region color-scales
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
// #endregion
