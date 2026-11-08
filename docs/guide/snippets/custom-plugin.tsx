// Source of the "Writing your own plugin" section of plugins-and-adapters.md.
// Compiled by `npm run typecheck:site`, rendered by __tests__/plugins.test.tsx and
// embedded verbatim in the markdown.

// #region custom-plugin
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { ChartPlugin, TransformedData } from 'lumagrid';

// What the data adapter produces and the renderer consumes.
interface Bar {
  label: string;
  value: number;
}

// The few theme tokens the renderer needs, picked by the theme adapter.
interface BarTheme {
  bar: string;
  text: string;
  fontFamily: string;
}

// The per-view config the plugin understands.
interface BarConfig {
  labelKey?: string;
  valueKey?: string;
}

const stripePlugin: ChartPlugin<Bar[], BarTheme, BarConfig> = {
  id: 'stripe-bars',
  label: 'Stripes',

  // TransformedData in, whatever the renderer wants out. Called with the view's config.
  dataAdapter(data: TransformedData, config?: BarConfig): Bar[] {
    const labelKey = config?.labelKey ?? data.fields.find((f) => f.type === 'string')?.key ?? '';
    const valueKey = config?.valueKey ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
    return data.rows.map((row) => ({
      label: String(row[labelKey] ?? ''),
      value: Number(row[valueKey] ?? 0),
    }));
  },

  // ThemeDefinition in, only the tokens this renderer reads out.
  themeAdapter(theme): BarTheme {
    return {
      bar: theme.colors.categorical[0] ?? '#3b82f6',
      text: theme.text.primary,
      fontFamily: theme.typography.fontFamily,
    };
  },

  // The contract field is named Renderer. It receives the adapted data and theme,
  // the pixel size, and the view's config.
  Renderer({ data, theme, width, height }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    const rowHeight = height / Math.max(data.length, 1);
    return (
      <div style={{ width, height, fontFamily: theme.fontFamily, color: theme.text }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', height: rowHeight }}>
            <span style={{ width: 80 }}>{d.label}</span>
            <span
              style={{
                display: 'inline-block',
                height: rowHeight * 0.6,
                width: (d.value / max) * (width - 100),
                background: theme.bar,
              }}
            />
          </div>
        ))}
      </div>
    );
  },
};

// Register once at startup. The call returns the id.
registerPlugin(stripePlugin);

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
    <ThemeProvider theme="light">
      <WidgetContainer data={sales} title="Custom plugin" width={500} height={300}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'stripe-bars' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
// #endregion
