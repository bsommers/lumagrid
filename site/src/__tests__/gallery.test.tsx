import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { extractRegion } from '../lib/region';
import { Gallery } from '../sections/Gallery';

describe('extractRegion', () => {
  const raw = [
    'import x from "y";',
    '',
    '// #region demo',
    '',
    '    <A>',
    '      <B />',
    '    </A>',
    '',
    '// #endregion',
    'tail();',
  ].join('\n');

  it('returns the region with common indentation removed and blank edges trimmed', () => {
    expect(extractRegion(raw, 'demo')).toBe('<A>\n  <B />\n</A>');
  });

  it('throws a clear error when the region is missing', () => {
    expect(() => extractRegion(raw, 'nope')).toThrow(/Region "nope" not found/);
  });

  it('throws when the region is not closed', () => {
    expect(() => extractRegion('// #region a\nx', 'a')).toThrow(/#endregion/);
  });
});

describe('Gallery bar card', () => {
  it('draws a live bar chart svg', () => {
    const { container } = render(<Gallery />);
    expect(container.querySelector('[data-lg-surface="bar"] svg[role="img"]')).not.toBeNull();
  });

  it('hides the code until show code is pressed, then shows the usage text', () => {
    render(<Gallery />);
    const card = screen.getByRole('article', { name: 'Horizontal bar chart' });
    const toggle = within(card).getByRole('button', { name: 'Show code' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(card).queryByText(/HorizontalBarChart/)).toBeNull();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(card.querySelector('pre code')?.textContent).toContain('<HorizontalBarChart');
    expect(card.querySelector('pre code')?.textContent).toContain('valueField="revenue"');
  });

  it('restyles the chart surface when the theme radio changes', () => {
    const { container } = render(<Gallery />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual(['neon', 'dark', 'light']);
    const surface = () => (container.querySelector('[data-lg-surface="bar"]') as HTMLElement).style.background;
    const neon = surface();
    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(surface()).not.toBe(neon);
    fireEvent.click(screen.getByRole('radio', { name: 'Neon' }));
    expect(surface()).toBe(neon);
  });
});

describe('Gallery native cards', () => {
  const NATIVE = [
    ['Horizontal bar chart', 'HorizontalBarChart', ['valueField', 'labelField']],
    ['Line chart', 'LineChart', ['valueField', 'labelField', 'colorField']],
    ['Pie chart', 'PieChart', ['valueField', 'labelField']],
    ['Force graph', 'ForceGraph', ['idField', 'labelField']],
    ['Choropleth', 'Choropleth', []],
    ['Data table', 'DataTable', []],
    ['Tree view', 'TreeView', []],
  ] as const;

  it('lists the seven native cards in catalog order', () => {
    render(<Gallery />);
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles.slice(0, 7)).toEqual(NATIVE.map((n) => n[0]));
  });

  it.each(NATIVE)('%s: code panel opens and names %s with role fields', (title, component, fields) => {
    render(<Gallery />);
    const card = screen.getByRole('article', { name: title });
    fireEvent.click(within(card).getByRole('button', { name: 'Show code' }));
    const text = card.querySelector('pre code')?.textContent ?? '';
    expect(text).toContain(component);
    for (const f of fields) expect(text).toContain(f);
    expect(text).not.toMatch(/\b[xy]Field\b/);
  });

  it('sorts the table when a column header is clicked', () => {
    render(<Gallery />);
    const card = screen.getByRole('article', { name: 'Data table' });
    const firstCell = () => card.querySelector('tbody tr td')?.textContent;
    expect(firstCell()).toBe('North');
    fireEvent.click(within(card).getByText('Revenue'));
    expect(firstCell()).toBe('East');
    fireEvent.click(within(card).getByText(/Revenue/));
    expect(firstCell()).toBe('South');
  });

  it('relayouts the force graph with a new seed', () => {
    render(<Gallery />);
    const card = screen.getByRole('article', { name: 'Force graph' });
    const positions = () => [...card.querySelectorAll('svg g[transform]')].map((g) => g.getAttribute('transform')).join('|');
    const before = positions();
    expect(before).not.toBe('');
    fireEvent.click(within(card).getByRole('button', { name: 'New layout' }));
    expect(positions()).not.toBe(before);
  });

  it('shows the label of the selected tree node', () => {
    render(<Gallery />);
    const card = screen.getByRole('article', { name: 'Tree view' });
    expect(within(card).getByText('nothing yet')).toBeInTheDocument();
    fireEvent.click(within(card).getByText('South'));
    expect(within(card).getByText('South', { selector: 'strong' })).toBeInTheDocument();
  });
});

describe('Gallery adapter cards', () => {
  it('lists ten cards: seven native then three adapters', () => {
    render(<Gallery />);
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toHaveLength(10);
    expect(titles.slice(7)).toEqual(['D3 bars', 'Recharts bars', 'Nivo bars']);
  });

  it('marks exactly three catalog entries as lazy adapters whose loaders resolve to function components', async () => {
    const { catalog } = await import('../demos/catalog');
    const adapters = catalog.filter((e) => e.kind === 'adapter');
    expect(adapters.map((a) => a.id)).toEqual(['d3', 'recharts', 'nivo']);
    for (const entry of adapters) {
      if (entry.kind !== 'adapter') continue;
      const mod = await entry.load();
      expect(typeof mod.default).toBe('function');
    }
  });

  it('draws the adapter charts once their lazy chunks load', async () => {
    const { container } = render(<Gallery />);
    for (const id of ['d3', 'recharts', 'nivo']) {
      await waitFor(() => {
        expect(container.querySelector(`[data-lg-surface="${id}"] svg`)).not.toBeNull();
      });
    }
  });

  it('shows the adapter source in the code panel', async () => {
    render(<Gallery />);
    for (const [title, needle] of [['D3 bars', 'createD3Plugin'], ['Recharts bars', 'createRechartsPlugin'], ['Nivo bars', 'createNivoPlugin']] as const) {
      const card = screen.getByRole('article', { name: title });
      fireEvent.click(within(card).getByRole('button', { name: 'Show code' }));
      expect(card.querySelector('pre code')?.textContent).toContain(needle);
    }
  });
});
