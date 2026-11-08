import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
