import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { App } from '../App';

describe('site shell', () => {
  it('renders the four section anchors in order', () => {
    const { container } = render(<App />);
    const ids = [...container.querySelectorAll('main > section')].map((s) => s.id);
    expect(ids).toEqual(['hero', 'features', 'gallery', 'links']);
  });
});
