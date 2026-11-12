import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { DataTable } from '../data-table.js';
import { lightTheme } from '../../theme/light.js';
import type { TransformedData } from '../../transforms/types.js';
import type { NativeChartProps } from '../../registry/native-plugin.js';

function renderTable(data: TransformedData, overrides: Partial<NativeChartProps> = {}) {
  return render(<DataTable data={data} width={400} height={300} theme={lightTheme} {...overrides} />);
}

const basicData: TransformedData = {
  rows: [
    { region: 'East', sales: 200 },
    { region: 'West', sales: 100 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'sales', type: 'number' },
  ],
};

describe('DataTable edge cases', () => {
  it('renders an empty table without crashing when there are no rows and no fields', () => {
    const { container } = renderTable({ rows: [], fields: [] });
    expect(container.querySelectorAll('th')).toHaveLength(0);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('sorts rows with missing values first when ascending', () => {
    renderTable({
      rows: [{ name: 'b' }, { name: null }, { name: 'a' }],
      fields: [{ key: 'name', type: 'string' }],
    });
    fireEvent.click(screen.getByText('name'));
    const cells = screen.getAllByRole('cell').map((c) => c.textContent);
    expect(cells).toEqual(['—', 'a', 'b']);
  });

  it('cycles desc back to asc on a third click and resets to asc when switching columns', () => {
    renderTable(basicData);
    const region = screen.getByText('region');
    fireEvent.click(region);
    fireEvent.click(region);
    fireEvent.click(region);
    const sortOf = (n: string) => screen.getByRole('columnheader', { name: new RegExp(n) }).getAttribute('aria-sort');
    expect(sortOf('region')).toBe('ascending');
    fireEvent.click(screen.getByText('sales'));
    expect(sortOf('sales')).toBe('ascending');
    expect(sortOf('region')).toBe('none');
  });

  it('goes back a page with the previous-page button and disables next on the last page', () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({ n: i }));
    renderTable({ rows, fields: [{ key: 'n', type: 'number' }] });
    const [prev, next] = screen.getAllByRole('button', { name: /^[←→]$/ });
    fireEvent.click(next!);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(next).toBeDisabled();
    fireEvent.click(prev!);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });
});

describe('DataTable rendering', () => {
  it('renders one header cell per field, using label when provided and key otherwise', () => {
    renderTable({
      rows: [{ a: 1, b: 2 }],
      fields: [{ key: 'a', type: 'number', label: 'Column A' }, { key: 'b', type: 'number' }],
    });

    expect(screen.getByText('Column A')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });

  it('derives fields from the first row\'s keys when data.fields is empty', () => {
    renderTable({ rows: [{ foo: 1, bar: 2 }], fields: [] });

    expect(screen.getByText('foo')).toBeInTheDocument();
    expect(screen.getByText('bar')).toBeInTheDocument();
  });

  it('formats a number field with toLocaleString', () => {
    renderTable({ rows: [{ n: 1234567 }], fields: [{ key: 'n', type: 'number' }] });

    expect(screen.getByText((1234567).toLocaleString())).toBeInTheDocument();
  });

  it('renders an em dash for null and undefined cell values', () => {
    renderTable({
      rows: [{ a: null, b: undefined }],
      fields: [{ key: 'a', type: 'string' }, { key: 'b', type: 'string' }],
    });

    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('does not render pagination controls when there is only one page', () => {
    renderTable(basicData);
    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
  });
});

describe('DataTable sorting', () => {
  it('sorts ascending by a column on first click, then descending on second click', () => {
    renderTable(basicData);
    const header = screen.getByText('region');

    fireEvent.click(header);
    let rows = screen.getAllByRole('row').slice(1); // skip header row
    expect(within(rows[0]!).getByText('East')).toBeInTheDocument();

    fireEvent.click(header);
    rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByText('West')).toBeInTheDocument();
  });

  it('shows an up arrow next to the active ascending sort column', () => {
    renderTable(basicData);
    fireEvent.click(screen.getByText('region'));
    expect(screen.getByText('region').parentElement!.textContent).toBe('region ↑');
  });
});

describe('DataTable accessibility', () => {
  it('renders sortable headers as focusable buttons with aria-sort, toggled by keyboard', () => {
    renderTable(basicData);
    const th = screen.getByRole('columnheader', { name: /region/ });
    expect(th).toHaveAttribute('aria-sort', 'none');
    const btn = within(th).getByRole('button');
    act(() => btn.focus());
    expect(btn).toHaveFocus();
    expect(btn.style.outline).toContain('solid');
    fireEvent.click(btn); // native buttons turn Enter/Space into click
    expect(th).toHaveAttribute('aria-sort', 'ascending');
    fireEvent.click(btn);
    expect(th).toHaveAttribute('aria-sort', 'descending');
  });
});

describe('DataTable pagination', () => {
  const manyRows: TransformedData = {
    rows: Array.from({ length: 30 }, (_, i) => ({ n: i })),
    fields: [{ key: 'n', type: 'number' }],
  };

  it('shows page controls and only the first page of rows when rows exceed the page size', () => {
    renderTable(manyRows);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1 + 25); // header + 25 data rows
  });

  it('advances to the next page when the next-page button is clicked', () => {
    renderTable(manyRows);
    fireEvent.click(screen.getByText('→'));
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1 + 5); // header + remaining 5 rows
  });

  it('disables the previous-page button on the first page', () => {
    renderTable(manyRows);
    expect(screen.getByText('←')).toBeDisabled();
    expect(screen.getByText('→')).not.toBeDisabled();
  });
});
