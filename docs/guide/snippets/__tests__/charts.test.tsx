import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Example as Bar, barView } from '../chart-bar.js';

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
});
