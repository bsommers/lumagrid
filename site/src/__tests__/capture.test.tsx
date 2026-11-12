import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { CaptureApp, CAPTURE_CHARTS, parseCaptureParams } from '../capture';
import { hexMap } from '../../../examples/shared/demos';

const themes = ['light', 'dark'];

describe('CAPTURE_CHARTS', () => {
  it('lists the seven native charts in order', () => {
    expect([...CAPTURE_CHARTS]).toEqual(['bar', 'line', 'pie', 'force', 'choropleth', 'table', 'tree']);
  });
});

describe('CaptureApp', () => {
  for (const chart of CAPTURE_CHARTS) {
    for (const theme of themes) {
      it(`draws ${chart} in the ${theme} theme and signals ready`, async () => {
        const { container } = render(<CaptureApp search={`?chart=${chart}&theme=${theme}`} />);
        const capture = container.querySelector('#capture');
        expect(capture).not.toBeNull();
        if (chart === 'table') expect(capture!.querySelector('table')).not.toBeNull();
        else if (chart === 'tree') expect(capture!.querySelector('[role="tree"]')).not.toBeNull();
        else expect(capture!.querySelector('svg[role="img"], svg[role="group"]')).not.toBeNull();
        await waitFor(() => expect(capture!.getAttribute('data-capture-ready')).toBe('1'));
      });
    }
  }

  it('is a fixed 640 by 400 box', () => {
    const { container } = render(<CaptureApp search="?chart=bar" />);
    const el = container.querySelector<HTMLElement>('#capture')!;
    expect(el.style.width).toBe('640px');
    expect(el.style.height).toBe('400px');
  });

  it('draws one path per hex tile in the choropleth', () => {
    const { container } = render(<CaptureApp search="?chart=choropleth" />);
    const paths = container.querySelectorAll('#capture svg path');
    expect(paths.length).toBe(hexMap.geo!.features.length);
    expect(paths.length).toBe(12);
  });

  const nodePositions = (search: string): string[] => {
    const { container, unmount } = render(<CaptureApp search={search} />);
    const out = [...container.querySelectorAll('g[transform]')].map((g) => g.getAttribute('transform') ?? '');
    unmount();
    return out;
  };

  it('lays out the force graph deterministically per seed', () => {
    const a = nodePositions('?chart=force&seed=1');
    const b = nodePositions('?chart=force&seed=1');
    const c = nodePositions('?chart=force&seed=2');
    expect(a.length).toBe(12);
    expect(a).toEqual(b);
    expect(c).not.toEqual(a);
  });

  const bad = [
    '?chart=nope',
    '?chart=',
    '',
    '?chart=bar&theme=blue',
    '?chart=bar&theme=',
    '?chart=force&seed=-1',
    '?chart=force&seed=1.5',
    '?chart=force&seed=abc',
    '?chart=force&seed=',
    '?chart=force&seed=1e3',
    '?chart=' + encodeURIComponent('<img src=x onerror=1>'),
    '?chart=bar&theme=' + encodeURIComponent('<script>alert(1)</script>'),
    '?chart=force&seed=' + encodeURIComponent('<b>1</b>'),
  ];
  for (const search of bad) {
    it(`shows only the fixed alert for ${JSON.stringify(search)}`, () => {
      const { container, getByRole } = render(<CaptureApp search={search} />);
      expect(getByRole('alert').textContent).toBe('Invalid capture request.');
      expect(container.querySelector('#capture')).toBeNull();
      expect(container.querySelector('img, script, b')).toBeNull();
      expect(container.outerHTML).not.toContain('onerror');
    });
  }

  it('parses valid parameters with defaults', () => {
    expect(parseCaptureParams('?chart=pie')).toEqual({ ok: true, chart: 'pie', theme: 'light', seed: 1 });
    expect(parseCaptureParams('?chart=force&theme=dark&seed=7')).toEqual({
      ok: true, chart: 'force', theme: 'dark', seed: 7,
    });
  });
});
