import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Heatmap } from '../heatmap.js';
import { lightTheme } from '../../theme/light.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = {
  fields: [
    { key: 'day', type: 'string' }, { key: 'hour', type: 'string' }, { key: 'n', type: 'number' },
  ] as TransformedData['fields'],
  rows: [
    { day: 'Mon', hour: 'AM', n: 1 }, { day: 'Mon', hour: 'PM', n: 9 },
    { day: 'Tue', hour: 'AM', n: 5 }, { day: 'Tue', hour: 'PM', n: null },
    { day: 'Wed', hour: 'AM', n: 2 }, { day: 'Thu', hour: 'AM', n: 'x' },
  ],
};
const draw = (d: TransformedData = data, o: Partial<React.ComponentProps<typeof Heatmap>> = {}) =>
  render(<Heatmap data={d} width={500} height={300} theme={lightTheme} columnField="day" rowField="hour" valueField="n" {...o} />);
const cells = (c: HTMLElement) => [...c.querySelectorAll('[role="gridcell"]')] as SVGGElement[];

describe('Heatmap', () => {
  it('renders a grid of cells with "row, column: value" labels', () => {
    const { container } = draw();
    expect(container.querySelector('svg')!.getAttribute('role')).toBe('grid');
    expect(container.querySelectorAll('[role="row"]')).toHaveLength(2);
    const labels = cells(container).map((c) => c.getAttribute('aria-label'));
    expect(labels).toContain('AM, Mon: 1');
    expect(labels).toContain('PM, Mon: 9');
    expect(labels).toContain('PM, Tue: no data');
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('infers fields and honours legacy aliases and ariaLabel', () => {
    const { container } = render(<Heatmap data={data} width={500} height={300} theme={lightTheme} ariaLabel="Traffic" />);
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Traffic');
    expect(cells(container).length).toBeGreaterThan(0);
    const l = render(<Heatmap data={data} width={500} height={300} theme={lightTheme} xField="day" yField="hour" valueField="n" />);
    expect(cells(l.container).map((c) => c.getAttribute('aria-label'))).toContain('AM, Mon: 1');
    const lf = render(<Heatmap data={data} width={500} height={300} theme={lightTheme} labelField="day" rowField="hour" />);
    expect(cells(lf.container)).toHaveLength(6);
  });

  it('colors min and max differently and shows a legend with min/max', () => {
    const { container } = draw();
    const fills = cells(container).map((c) => c.querySelector('rect')!.getAttribute('fill'));
    expect(fills[0]).not.toBe(fills[1]);
    const legend = container.querySelector('[data-testid="heatmap-legend"]')!;
    expect(legend.textContent).toContain('1');
    expect(legend.textContent).toContain('9');
    expect(draw(data, { showLegend: false }).container.querySelector('[data-testid="heatmap-legend"]')).toBeNull();
  });

  it('shows value labels unless disabled, with contrast-safe fill for hex, rgb() and unknown colors', () => {
    expect(draw().container.querySelectorAll('text[pointer-events="none"]').length).toBeGreaterThan(0);
    expect(draw(data, { showValues: false }).container.querySelectorAll('text[pointer-events="none"]')).toHaveLength(0);
    const textFill = (seq: string[]) => {
      const t = { ...lightTheme, colors: { ...lightTheme.colors, sequential: seq } };
      const { container } = draw(data, { theme: t });
      return container.querySelector('text[pointer-events="none"]')!.getAttribute('fill');
    };
    expect(textFill(['#000000'])).toBe(lightTheme.text.inverse);
    expect(textFill(['#ffffff'])).toBe(lightTheme.text.primary);
    expect(textFill(['rgb(0,0,0)'])).toBe(lightTheme.text.inverse);
    expect(textFill(['rebeccapurple'])).toBeTruthy();
    // dark low end (rgb from interpolation) vs light low end
    const { container } = draw();
    const fills = [...container.querySelectorAll('text[pointer-events="none"]')].map((t) => t.getAttribute('fill'));
    expect(new Set(fills).size).toBe(2);
  });

  it('supports roving tabindex and arrow-key navigation with a focus ring', () => {
    const { container } = draw();
    const all = () => cells(container);
    expect(all().filter((c) => c.getAttribute('tabindex') === '0')).toHaveLength(1);
    fireEvent.focus(all()[0]!);
    expect(container.querySelector('[data-testid="heatmap-focus-ring"]')).not.toBeNull();
    // columns: Mon,Tue,Wed ; rows AM,PM -> index = r*3 + c
    fireEvent.keyDown(all()[0]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(all()[1]);
    fireEvent.keyDown(all()[1]!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(all()[4]);
    fireEvent.keyDown(all()[4]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(all()[3]);
    fireEvent.keyDown(all()[3]!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(all()[0]);
    fireEvent.keyDown(all()[0]!, { key: 'End' });
    expect(document.activeElement).toBe(all()[2]);
    fireEvent.keyDown(all()[2]!, { key: 'Home' });
    expect(document.activeElement).toBe(all()[0]);
    fireEvent.keyDown(all()[0]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(all()[0]);
    fireEvent.keyDown(all()[0]!, { key: 'a' });
    fireEvent.blur(all()[0]!);
    expect(container.querySelector('[data-testid="heatmap-focus-ring"]')).toBeNull();
  });

  it('calls onSelect on click and Enter/Space, but not for empty cells', () => {
    const onSelect = vi.fn();
    const { container } = draw(data, { onSelect });
    const c = cells(container);
    fireEvent.click(c[1]!);
    expect(onSelect).toHaveBeenLastCalledWith({ row: 'AM', column: 'Tue', value: 5 });
    fireEvent.keyDown(c[0]!, { key: 'Enter' });
    expect(onSelect).toHaveBeenLastCalledWith({ row: 'AM', column: 'Mon', value: 1 });
    fireEvent.keyDown(c[0]!, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(3);
    fireEvent.click(c[5]!);
    fireEvent.keyDown(c[5]!, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(3);
    // no handler: no throw
    const bare = draw();
    fireEvent.keyDown(cells(bare.container)[0]!, { key: 'Enter' });
  });

  it('handles empty data, a constant value and tiny sizes', () => {
    const empty = draw({ ...data, rows: [] });
    expect(cells(empty.container)).toHaveLength(0);
    expect(empty.container.innerHTML).not.toContain('NaN');
    const same = draw({ ...data, rows: [{ day: 'a', hour: 'b', n: 3 }] });
    expect(same.container.innerHTML).not.toContain('NaN');
    const tiny = draw(data, { width: 10, height: 10 });
    expect(tiny.container.querySelectorAll('text[pointer-events="none"]')).toHaveLength(0);
    const noFields = render(<Heatmap data={{ rows: [{ a: 1 }], fields: [] }} width={100} height={100} theme={lightTheme} />);
    expect(noFields.container.querySelector('svg')).not.toBeNull();
    const long = draw({ ...data, rows: [{ day: 'A very long column name', hour: 'A very long row name', n: 2 }] });
    expect(long.container.textContent).toContain('…');
  });
});
