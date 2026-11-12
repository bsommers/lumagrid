import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Examples } from '../sections/Examples';
import { parseCsv } from '../lib/csv';
import { contrastRatio, wcagLevel } from '../lib/contrast';

describe('lib helpers', () => {
  it('parses csv and infers types', () => {
    const r = parseCsv('a,b\nx,1\ny,2');
    expect(r.ok && r.data.fields.map((f) => f.type)).toEqual(['string', 'number']);
  });
  it('returns friendly errors, never throws', () => {
    for (const bad of ['', 'a,b', 'a,b\n1', 'a,a\n1,2', 'a,\n1,2']) {
      const r = parseCsv(bad);
      expect(r.ok).toBe(false);
    }
  });
  it('computes contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('nope', '#fff')).toBe(1);
    expect(wcagLevel(3)).toBe('Fail');
  });
});

describe('Examples', () => {
  it('renders four panels with the examples id', () => {
    const { container } = render(<Examples />);
    expect(container.querySelector('section#examples')).not.toBeNull();
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('swaps the engine live', async () => {
    const { container } = render(<Examples />);
    expect(container.querySelector('[data-lg-surface="engine"] svg')).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Recharts' }));
    await waitFor(() => expect(screen.getByText(/with Recharts/)).toBeInTheDocument());
    expect(container.querySelector('pre code')?.textContent).toContain('ex-recharts');
  });

  it('filters the dashboard', () => {
    render(<Examples />);
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'North' } });
    expect(screen.getByText(/Showing North/)).toBeInTheDocument();
  });

  it('shows an inline error for invalid csv', () => {
    render(<Examples />);
    fireEvent.change(screen.getByLabelText('CSV data'), { target: { value: 'a,b\n1' } });
    expect(screen.getByText(/Row 1 has 1 value/)).toBeInTheDocument();
  });

  it('updates the contrast readout', () => {
    render(<Examples />);
    const list = screen.getByLabelText('Contrast readout');
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: '#060708' } });
    expect(within(list).getByText(/Text on background/).textContent).toContain('fails');
  });
});
