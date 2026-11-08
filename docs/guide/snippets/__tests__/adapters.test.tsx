import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
// Importing registers the plugins the snippets need. Do not reset the registry in this file.
// Each snippet registers a different id, so importing all three is safe.
import { Example as D3Example } from '../adapters-d3.js';
import { Example as RechartsExample } from '../adapters-recharts.js';
import { Example as NivoExample } from '../adapters-nivo.js';

describe('adapter snippets render', () => {
  it('D3 draws svg bars through the mount callback', () => {
    const { container } = render(<D3Example />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('svg rect')).toHaveLength(3);
    expect(container.textContent).toContain('North');
  });

  it('Recharts draws a fixed-size chart', () => {
    const { container } = render(<RechartsExample />);
    expect(container.querySelector('svg.recharts-surface')).not.toBeNull();
    expect(container.querySelectorAll('.recharts-bar-rectangle').length).toBeGreaterThan(0);
  });

  it('Nivo draws a fixed-size bar chart', () => {
    const { container } = render(<NivoExample />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
