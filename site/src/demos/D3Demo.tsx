import React from 'react';
import { select, scaleBand, scaleLinear } from 'd3';
import { ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createD3Plugin } from 'lumagrid/plugins';
import type { D3Theme } from 'lumagrid/plugins';
import { sales } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

// #region code
interface Bar {
  label: string;
  value: number;
}

// Draw (or redraw) the bars. Hovering a bar highlights it.
function draw(el: HTMLDivElement, bars: Bar[], theme: D3Theme, width: number, height: number): void {
  const x = scaleBand<string>().domain(bars.map((b) => b.label)).range([0, width]).padding(0.25);
  const y = scaleLinear().domain([0, Math.max(...bars.map((b) => b.value), 1)]).range([height - 24, 8]);
  const svg = select(el).selectAll<SVGSVGElement, null>('svg').data([null]).join('svg')
    .attr('width', width)
    .attr('height', height);

  svg.selectAll<SVGRectElement, Bar>('rect')
    .data(bars)
    .join('rect')
    .attr('x', (d) => x(d.label) ?? 0)
    .attr('y', (d) => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', (d) => height - 24 - y(d.value))
    .attr('fill', theme.colors[0] ?? 'steelblue')
    .attr('opacity', 0.75)
    .on('mouseenter', (event: MouseEvent) => select(event.currentTarget as SVGRectElement).attr('opacity', 1))
    .on('mouseleave', (event: MouseEvent) => select(event.currentTarget as SVGRectElement).attr('opacity', 0.75));

  svg.selectAll<SVGTextElement, Bar>('text')
    .data(bars)
    .join('text')
    .attr('x', (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
    .attr('y', height - 8)
    .attr('text-anchor', 'middle')
    .attr('fill', theme.foreground)
    .attr('font-family', theme.fontFamily)
    .attr('font-size', theme.fontSize)
    .text((d) => d.label);
}

registerPlugin(createD3Plugin<Bar[]>({
  id: 'gallery-d3',
  label: 'Bars (D3)',
  dataAdapter: (data: TransformedData) =>
    data.rows.map((row) => ({ label: String(row['region'] ?? ''), value: Number(row['revenue'] ?? 0) })),
  mount: draw,
  update: draw,
  destroy: (el) => { select(el).selectAll('*').remove(); },
}));

export default function D3Demo({ width, height }: DemoProps): React.ReactElement {
  return <ViewSwitcher views={[{ id: 'gallery-d3' }]} data={sales} width={width} height={height} />;
}
// #endregion
