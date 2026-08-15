import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createD3Plugin } from '../d3-adapter.js';
import type { ThemeDefinition } from '../../theme/types.js';

const fakeTheme: ThemeDefinition = {
  name: 'fake',
  colors: {
    categorical: ['#111111', '#222222'],
    sequential: ['#333333'],
    diverging: ['#444444'],
  },
  typography: {
    fontFamily: 'Fake Sans',
    fontSizeBase: '14px',
    fontSizeSm: '11px',
    fontSizeLg: '16px',
    fontWeightNormal: 400,
    fontWeightBold: 700,
    lineHeight: 1.4,
  },
  spacing: { base: 8, xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  surface: {
    background: '#aaaaaa',
    surface: '#bbbbbb',
    border: '#cccccc',
    borderRadius: '4px',
    shadowSm: 'none',
    shadowMd: 'none',
  },
  text: {
    primary: '#000001',
    secondary: '#000002',
    disabled: '#000003',
    inverse: '#ffffff',
  },
};

function fakePlugin(id: string, overrides: Partial<{ mount: () => void; update: () => void; destroy: () => void }> = {}) {
  const mount = overrides.mount ?? vi.fn();
  const update = overrides.update ?? vi.fn();
  const destroy = overrides.destroy ?? vi.fn();
  const plugin = createD3Plugin({
    id,
    dataAdapter: (data) => data.rows,
    mount: mount as () => void,
    update: update as () => void,
    destroy: destroy as () => void,
  });
  return { plugin, mount, update, destroy };
}

describe('createD3Plugin theme mapping', () => {
  it('maps ThemeDefinition to D3Theme', () => {
    const { plugin } = fakePlugin('d3-theme-test');
    expect(plugin.themeAdapter(fakeTheme)).toEqual({
      colors: ['#111111', '#222222'],
      sequentialColors: ['#333333'],
      fontFamily: 'Fake Sans',
      fontSize: '11px',
      background: '#aaaaaa',
      foreground: '#000001',
      border: '#cccccc',
    });
  });
});

describe('createD3Plugin Renderer lifecycle', () => {
  it('calls mount once on initial render, not update', () => {
    const { plugin, mount, update } = fakePlugin('d3-lifecycle-mount');
    const theme = plugin.themeAdapter(fakeTheme);
    const { container } = render(<plugin.Renderer data={[]} theme={theme} width={100} height={50} />);
    const el = container.querySelector('div');

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount.mock.calls[0]?.[0]).toBe(el);
    expect(mount.mock.calls[0]?.[1]).toEqual([]);
    expect(mount.mock.calls[0]?.[2]).toBe(theme);
    expect(mount.mock.calls[0]?.[3]).toBe(100);
    expect(mount.mock.calls[0]?.[4]).toBe(50);
    expect(update).not.toHaveBeenCalled();
  });

  it('calls update (not mount again) when data/width change after mount', () => {
    const { plugin, mount, update } = fakePlugin('d3-lifecycle-update');
    const theme = plugin.themeAdapter(fakeTheme);
    const { rerender, container } = render(<plugin.Renderer data={[]} theme={theme} width={100} height={50} />);
    const el = container.querySelector('div');
    const newData = [{ x: 1 }];

    rerender(<plugin.Renderer data={newData} theme={theme} width={200} height={50} />);

    expect(mount).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]?.[0]).toBe(el);
    expect(update.mock.calls[0]?.[1]).toBe(newData);
    expect(update.mock.calls[0]?.[2]).toBe(theme);
    expect(update.mock.calls[0]?.[3]).toBe(200);
    expect(update.mock.calls[0]?.[4]).toBe(50);
  });

  it('does not call mount or update again when re-rendered with identical props', () => {
    const { plugin, mount, update } = fakePlugin('d3-lifecycle-stable');
    const theme = plugin.themeAdapter(fakeTheme);
    const data: unknown[] = [];
    const { rerender } = render(<plugin.Renderer data={data} theme={theme} width={100} height={50} />);

    rerender(<plugin.Renderer data={data} theme={theme} width={100} height={50} />);

    expect(mount).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });

  it('calls destroy with the container element on unmount', () => {
    const { plugin, destroy } = fakePlugin('d3-lifecycle-destroy');
    const theme = plugin.themeAdapter(fakeTheme);
    const { unmount, container } = render(<plugin.Renderer data={[]} theme={theme} width={100} height={50} />);
    const el = container.querySelector('div');

    unmount();

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(destroy.mock.calls[0]?.[0]).toBe(el);
  });
});
