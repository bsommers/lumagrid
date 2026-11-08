import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
// Importing registers the plugins the snippets need. Do not reset the registry in this file.
import { Example as Quickstart } from '../quickstart.js';
import { Example as Transforms, wide, grouped } from '../transforms.js';
import { Example as Theming, brandTheme, swatches, grade } from '../theming.js';

describe('guide snippets render', () => {
  it('quickstart draws a bar chart', () => {
    render(<Quickstart />);
    const chart = screen.getByRole('img');
    expect(chart.tagName.toLowerCase()).toBe('svg');
    expect(screen.getByText('North')).toBeInTheDocument();
  });

  it('transforms draws the flattened and aggregated data', () => {
    render(<Transforms />);
    const chart = screen.getByRole('img');
    expect(chart.tagName.toLowerCase()).toBe('svg');
    // flatten -> aggregate leaves one bar per region, with the revenues summed.
    expect(screen.getByText('North')).toBeInTheDocument();
    expect(screen.getByText('South')).toBeInTheDocument();
    expect(screen.queryByText('Widget A')).not.toBeInTheDocument();
    expect(screen.getByText('North: 20,500')).toBeInTheDocument();
    expect(screen.getByText('South: 23,500')).toBeInTheDocument();
  });

  it('transforms results match the values stated in the chapter', () => {
    expect(wide.rows).toEqual([
      { region: 'East', Q1: 10, Q2: 20 },
      { region: 'West', Q1: 5, Q2: 8 },
    ]);
    expect(wide.fields.map((f) => f.key)).toEqual(['region', 'Q1', 'Q2']);
    expect(grouped.rows).toEqual([
      { region: 'East', count: 2, sales: 30 },
      { region: 'West', count: 2, sales: 13 },
    ]);
    expect(grouped.hierarchy?.label).toBe('region');
    expect(grouped.hierarchy?.children?.map((c) => [c.id, c.value])).toEqual([
      ['East', 30],
      ['West', 13],
    ]);
    expect(grouped.geo?.features.map((f) => f.properties)).toEqual([
      { name: 'East region', region: 'East', count: 2, sales: 30 },
      { name: 'West region', region: 'West', count: 2, sales: 13 },
    ]);
  });

  it('theming draws one chart per provider, each with its own theme', () => {
    render(<Theming />);
    const charts = screen.getAllByRole('img');
    expect(charts).toHaveLength(2);
    charts.forEach((c) => expect(c.tagName.toLowerCase()).toBe('svg'));
    expect(screen.getByText('Theme: light')).toBeInTheDocument();
    expect(screen.getByText('Theme: brand')).toBeInTheDocument();
  });

  it('theming color helpers return the values stated in the chapter', () => {
    const [first, second, wrapped] = swatches.series;
    expect(first).toBe(brandTheme.colors.categorical[0]);
    expect(second).toBe(brandTheme.colors.categorical[1]);
    expect(wrapped).toBe(brandTheme.colors.categorical[1]);
    expect(swatches.sequentialEnds).toEqual(['rgb(8,48,107)', 'rgb(222,235,247)']);
    expect(swatches.divergingMid).toBe('rgb(254,224,144)');
    expect([grade(40), grade(50), grade(79), grade(80)]).toEqual([
      '#f87171', '#facc15', '#facc15', '#34d399',
    ]);
  });
});
