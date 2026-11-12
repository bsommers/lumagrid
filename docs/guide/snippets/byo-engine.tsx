// Source of bring-your-own-engine.md (engine, plugin and registration steps). Compiled by
// `npm run typecheck:site`, rendered and checked by __tests__/byo-engine.test.tsx.

// #region engine
// "Tinyplot", a plain-SVG engine small enough to read in one sitting. It knows nothing about
// Lumagrid: it takes labelled numbers and a pixel size and returns the rectangles to draw.
export interface TinyBar {
  label: string;
  value: number;
}

export interface TinyRect {
  label: string;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function layoutBars(bars: TinyBar[], width: number, height: number, gap = 6): TinyRect[] {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const slot = width / Math.max(bars.length, 1);
  return bars.map((bar, i) => {
    const barHeight = (bar.value / max) * (height - 20);
    return {
      ...bar,
      x: i * slot + gap / 2,
      y: height - 20 - barHeight,
      width: Math.max(slot - gap, 1),
      height: barHeight,
    };
  });
}
// #endregion

// #region plugin
import type { ChartPlugin, TransformedData } from 'lumagrid';

// What the theme adapter hands to the renderer: only the tokens Tinyplot paints with.
export interface TinyTheme {
  bar: string;
  text: string;
  fontFamily: string;
}

// The per-view config the plugin understands.
export interface TinyConfig {
  labelKey?: string;
  valueKey?: string;
}

export const tinyPlugin: ChartPlugin<TinyBar[], TinyTheme, TinyConfig> = {
  id: 'tinyplot',
  label: 'Tinyplot',

  // Read the data, never change it: the rows may be shared with other views.
  dataAdapter(data: TransformedData, config?: TinyConfig): TinyBar[] {
    const labelKey = config?.labelKey ?? data.fields.find((f) => f.type === 'string')?.key ?? '';
    const valueKey = config?.valueKey ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
    return data.rows.map((row) => ({
      label: String(row[labelKey] ?? ''),
      value: Number(row[valueKey] ?? 0),
    }));
  },

  // Different themes must give different tokens, or the plugin ignores light and dark.
  themeAdapter(theme): TinyTheme {
    return {
      bar: theme.colors.categorical[0] ?? '#3b82f6',
      text: theme.text.primary,
      fontFamily: theme.typography.fontFamily,
    };
  },

  Renderer({ data, theme, width, height }) {
    const rects = layoutBars(data, width, height);
    return (
      // role and aria-label give assistive technology a name for the chart; the size comes from
      // the props, so the chart follows its container.
      <svg width={width} height={height} role="img" aria-label={`Bar chart of ${data.length} values`}>
        {rects.map((r) => (
          <g key={r.label}>
            <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={theme.bar}>
              <title>{`${r.label}: ${r.value}`}</title>
            </rect>
            <text x={r.x + r.width / 2} y={height - 5} textAnchor="middle" fill={theme.text} fontFamily={theme.fontFamily} fontSize={11}>
              {r.label}
            </text>
          </g>
        ))}
      </svg>
    );
  },
};
// #endregion

// #region register
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';

// Register once at startup. The call returns the id.
registerPlugin(tinyPlugin);

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

export function Example() {
  return (
    <ThemeProvider theme="dark">
      <WidgetContainer data={sales} title="Tinyplot" width={500} height={300}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'tinyplot' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
// #endregion
