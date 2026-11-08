// Source of the D3 section of plugins-and-adapters.md. Compiled by `npm run typecheck:site`,
// rendered by __tests__/adapters.test.tsx and embedded verbatim in the markdown.

// #region d3-bars
import { select, scaleBand, scaleLinear } from 'd3';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createD3Plugin } from 'lumagrid/plugins';
import type { D3Theme } from 'lumagrid/plugins';

interface Bar {
  label: string;
  value: number;
}

// Draw (or redraw) the bars. D3 builds elements with append, attr and text only.
function draw(el: HTMLDivElement, bars: Bar[], theme: D3Theme, width: number, height: number): void {
  const x = scaleBand<string>().domain(bars.map((b) => b.label)).range([0, width]).padding(0.2);
  const max = Math.max(...bars.map((b) => b.value), 1);
  const y = scaleLinear().domain([0, max]).range([height - 20, 0]);

  const svg = select(el).selectAll<SVGSVGElement, null>('svg').data([null]).join('svg')
    .attr('width', width)
    .attr('height', height);

  svg.selectAll<SVGRectElement, Bar>('rect')
    .data(bars)
    .join('rect')
    .attr('x', (d) => x(d.label) ?? 0)
    .attr('y', (d) => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', (d) => height - 20 - y(d.value))
    .attr('fill', theme.colors[0] ?? 'steelblue');

  svg.selectAll<SVGTextElement, Bar>('text')
    .data(bars)
    .join('text')
    .attr('x', (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
    .attr('y', height - 6)
    .attr('text-anchor', 'middle')
    .attr('fill', theme.foreground)
    .attr('font-family', theme.fontFamily)
    .attr('font-size', theme.fontSize)
    .text((d) => d.label);
}

const d3BarsPlugin = createD3Plugin<Bar[]>({
  id: 'd3-bars',
  label: 'Bars (D3)',
  // Reshape TransformedData into the array the D3 code wants.
  dataAdapter: (data: TransformedData) =>
    data.rows.map((row) => ({ label: String(row['region'] ?? ''), value: Number(row['revenue'] ?? 0) })),
  // mount runs once, update on every data, size or theme change, destroy on unmount.
  mount: draw,
  update: draw,
  destroy(el) {
    select(el).selectAll('*').remove();
  },
});

registerPlugin(d3BarsPlugin);

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
      <WidgetContainer data={sales} title="D3 bars" width={500} height={300}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'd3-bars' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
// #endregion
