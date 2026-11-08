import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
// Importing registers the plugins the snippet needs. Do not reset the registry in this file.
import { Example as Quickstart } from '../quickstart.js';

describe('guide snippets render', () => {
  it('quickstart draws a bar chart', () => {
    render(<Quickstart />);
    const chart = screen.getByRole('img');
    expect(chart.tagName.toLowerCase()).toBe('svg');
    expect(screen.getByText('North')).toBeInTheDocument();
  });
});
