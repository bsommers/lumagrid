import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Example as Bar, barView } from '../chart-bar.js';
import { Example as Line, lineView } from '../chart-line.js';
import { Example as Pie, pieView } from '../chart-pie.js';
import { Example as Table, tableView } from '../chart-table.js';
import { Example as Force, forceView } from '../chart-force.js';
import { Example as MapChart, choroplethView, projectedPaths, tiles } from '../chart-choropleth.js';
import { Example as Tree, grouped } from '../chart-tree.js';
import { Example as Scatter, scatterView } from '../chart-scatter.js';
import { Example as Area, areaView } from '../chart-area.js';
import { Example as Column, columnView } from '../chart-column.js';
import { Example as HeatmapExample, heatmapView } from '../chart-heatmap.js';
import { Choropleth } from '../../../../src/viz/choropleth.js';
import { lightTheme } from '../../../../src/theme/light.js';

describe('chart page snippets render', () => {
  it('bar draws one labelled bar per row', () => {
    const { container } = render(<Bar />);
    const chart = screen.getByRole('img');
    expect(chart.tagName.toLowerCase()).toBe('svg');
    expect(chart.getAttribute('aria-label')).toBe('Revenue by region');
    expect(container.querySelectorAll('svg rect')).toHaveLength(4);
    expect(screen.getByText('North')).toBeInTheDocument();
    expect(barView.config).toEqual({ valueField: 'revenue', labelField: 'region' });
  });

  it('line draws one path per colorField series', () => {
    const { container } = render(<Line />);
    const chart = screen.getByRole('img');
    expect(chart.tagName.toLowerCase()).toBe('svg');
    expect(chart.getAttribute('aria-label')).toBe('Monthly revenue by region');
    expect(container.querySelectorAll('svg path')).toHaveLength(2);
    expect(screen.getAllByText('Jan').length).toBeGreaterThan(0);
    expect(lineView.config.colorField).toBe('region');
  });

  it('pie draws one slice per row and the donut total', () => {
    const { container } = render(<Pie />);
    const chart = screen.getByRole('img');
    expect(chart.tagName.toLowerCase()).toBe('svg');
    expect(container.querySelectorAll('svg path')).toHaveLength(4);
    expect(container.textContent).toContain('46,600');
    expect(pieView.config.donut).toBe(true);
  });

  it('table draws a header per field and sorts when a header is clicked', () => {
    const { container } = render(<Table />);
    expect(container.querySelector('table')).not.toBeNull();
    expect(container.querySelectorAll('th')).toHaveLength(4);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(4);
    fireEvent.click(screen.getByText('Revenue'));
    expect(container.querySelector('tbody tr td')!.textContent).toBe('North');
    expect(screen.getByRole('columnheader', { name: /Revenue/ })).toHaveAttribute('aria-sort', 'ascending');
    expect(tableView.id).toBe('table');
  });

  it('force draws a circle per node and a line per edge', async () => {
    const { container } = render(<Force />);
    const chart = screen.getByRole('group', { name: 'Module dependency graph' });
    expect(chart.tagName.toLowerCase()).toBe('svg');
    await waitFor(() => expect(container.querySelectorAll('circle')).toHaveLength(4));
    expect(container.querySelectorAll('line')).toHaveLength(4);
    expect(forceView.config.seed).toBe(1);
  });

  it('choropleth draws a path per feature, and a placeholder without projectedPaths', () => {
    const { container, unmount } = render(<MapChart />);
    expect(screen.getByRole('img').tagName.toLowerCase()).toBe('svg');
    expect(container.querySelectorAll('svg path')).toHaveLength(3);
    expect(Object.keys(projectedPaths)).toHaveLength(3);
    expect(choroplethView.config.valueProperty).toBe('value');
    unmount();
    const bare = render(<Choropleth data={tiles} width={400} height={240} theme={lightTheme} valueProperty="value" />);
    expect(bare.container.querySelector('svg')).toBeNull();
    expect(bare.container.textContent).toContain('Pass projectedPaths');
  });

  it('tree starts with the root open and reports selected nodes', () => {
    const picked: string[] = [];
    render(<Tree onPick={(n) => picked.push(n.id)} />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
    expect(screen.getAllByRole('treeitem')).toHaveLength(4);
    expect(grouped.hierarchy?.children).toHaveLength(3);
    fireEvent.click(screen.getByText('North'));
    expect(picked).toEqual(['North']);
  });

  it('scatter draws a focusable point per row with a legend', () => {
    const { container } = render(<Scatter />);
    expect(screen.getByRole('group').getAttribute('aria-label')).toBe('Revenue against marketing spend by channel');
    expect(container.querySelectorAll('[data-scatter-point]')).toHaveLength(6);
    expect(screen.getByLabelText('Legend')).toBeInTheDocument();
    expect(scatterView.config.sizeField).toBe('signups');
  });

  it('area draws one stacked area per series', () => {
    const { container } = render(<Area />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Monthly revenue by region');
    expect(container.querySelectorAll('svg path').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector('table[data-area-chart-data]')).not.toBeNull();
    expect(areaView.config.stacked).toBe(true);
  });

  it('column draws one bar per month and region', () => {
    const { container } = render(<Column />);
    expect(screen.getByRole('img', { name: 'Monthly revenue by region' }).tagName.toLowerCase()).toBe('svg');
    expect(container.querySelectorAll('svg rect[role="img"], svg g[role="img"] rect').length).toBeGreaterThan(0);
    expect(columnView.config.mode).toBe('stacked');
  });

  it('heatmap is a grid with one cell per row of data', () => {
    render(<HeatmapExample />);
    expect(screen.getByRole('grid', { name: 'Support tickets by weekday and time slot' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(6);
    expect(heatmapView.config.rowField).toBe('day');
  });
});
