import { select, scaleBand, scaleLinear } from 'd3';
import { registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createD3Plugin } from 'lumagrid/plugins';
import type { D3Theme } from 'lumagrid/plugins';

export const D3_ID = 'ex-d3';
interface Bar { label: string; value: number }
interface Cfg { labelField?: string; valueField?: string }

function draw(el: HTMLDivElement, bars: Bar[], theme: D3Theme, width: number, height: number): void {
  const x = scaleBand<string>().domain(bars.map((b) => b.label)).range([0, width]).padding(0.25);
  const y = scaleLinear().domain([0, Math.max(...bars.map((b) => b.value), 1)]).range([height - 24, 8]);
  const svg = select(el).selectAll<SVGSVGElement, null>('svg').data([null]).join('svg')
    .attr('width', width).attr('height', height).attr('role', 'img').attr('aria-label', 'Bar chart (D3)');
  svg.selectAll<SVGRectElement, Bar>('rect').data(bars).join('rect')
    .attr('x', (d) => x(d.label) ?? 0).attr('y', (d) => y(d.value))
    .attr('width', x.bandwidth()).attr('height', (d) => height - 24 - y(d.value))
    .attr('fill', (_d, i) => theme.colors[i % theme.colors.length] ?? 'steelblue')
    .each(function (d) {
      select(this).selectAll('title').data([d]).join('title').text(`${d.label}: ${d.value.toLocaleString()}`);
    });
  svg.selectAll<SVGTextElement, Bar>('text').data(bars).join('text')
    .attr('x', (d) => (x(d.label) ?? 0) + x.bandwidth() / 2).attr('y', height - 8)
    .attr('text-anchor', 'middle').attr('fill', theme.foreground)
    .attr('font-family', theme.fontFamily).attr('font-size', theme.fontSize).text((d) => d.label);
}

registerPlugin(createD3Plugin<Bar[], Cfg>({
  id: D3_ID,
  label: 'D3',
  dataAdapter: (data: TransformedData, cfg) =>
    data.rows.map((r) => ({ label: String(r[cfg?.labelField ?? 'region'] ?? ''), value: Number(r[cfg?.valueField ?? 'revenue'] ?? 0) })),
  mount: draw,
  update: draw,
  destroy: (el) => { select(el).selectAll('*').remove(); },
}));
