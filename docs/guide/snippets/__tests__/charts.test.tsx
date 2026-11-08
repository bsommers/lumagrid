import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Example as Bar, barView } from '../chart-bar.js';
import { Example as Line, lineView } from '../chart-line.js';
import { Example as Pie, pieView } from '../chart-pie.js';
import { Example as Table, tableView } from '../chart-table.js';

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
    expect(screen.getByText('Jan')).toBeInTheDocument();
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
    expect(screen.getByText(/Revenue ↑/)).toBeInTheDocument();
    expect(tableView.id).toBe('table');
  });
});
