import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Example, layoutBars } from '../byo-engine.js';
import { proveTinyplot, report } from '../byo-engine-check.js';

describe('bring-your-own-engine snippets', () => {
  it('draws one rectangle per row through the registered plugin', () => {
    const { container } = render(<Example />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Bar chart of 3 values');
    expect(container.querySelectorAll('svg rect')).toHaveLength(3);
    expect(screen.getByText('North')).toBeInTheDocument();
  });

  it('lays out the tallest bar to the full plot height', () => {
    const [a, b] = layoutBars([{ label: 'a', value: 5 }, { label: 'b', value: 10 }], 100, 120);
    expect(b?.height).toBe(100);
    expect(a?.height).toBe(50);
    expect(layoutBars([], 100, 100)).toEqual([]);
  });

  it('the plugin passes the conformance kit', () => {
    expect(report.ok).toBe(true);
    expect(report.checks).toHaveLength(8);
    expect(() => proveTinyplot()).not.toThrow();
  });
});
