import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { CaptureApp } from '../capture';

describe('CaptureApp (bar)', () => {
  for (const theme of ['light', 'dark']) {
    it(`draws the bar chart in the ${theme} theme and signals ready`, async () => {
      const { container } = render(<CaptureApp search={`?chart=bar&theme=${theme}`} />);
      const capture = container.querySelector('#capture');
      expect(capture).not.toBeNull();
      expect(capture!.querySelector('svg[role="img"]')).not.toBeNull();
      await waitFor(() => expect(capture!.getAttribute('data-capture-ready')).toBe('1'));
    });
  }

  it('renders only the fixed alert for markup in a parameter', () => {
    const { container, getByRole } = render(
      <CaptureApp search={'?chart=' + encodeURIComponent('<img src=x onerror=1>')} />,
    );
    expect(getByRole('alert').textContent).toBe('Invalid capture request.');
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toContain('onerror');
  });
});
