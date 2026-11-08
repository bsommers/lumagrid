import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { listPlugins } from '../../../../src/registry/index.js';
// Importing registers the plugin the snippet defines. Do not reset the registry in this file.
import { Example } from '../custom-plugin.js';

describe('custom plugin snippet', () => {
  it('registers under its id and draws one labelled row per data row', () => {
    render(<Example />);
    expect(listPlugins()).toContain('stripe-bars');
    expect(screen.getByText('North')).toBeInTheDocument();
    expect(screen.getByText('South')).toBeInTheDocument();
    expect(screen.getByText('East')).toBeInTheDocument();
  });
});
