import React from 'react';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import { ViewSwitcher } from '../view-switcher.js';
import { ThemeProvider } from '../../theme/provider.js';
import { lightTheme } from '../../theme/light.js';
import { registerPlugin, __resetRegistryForTests } from '../../registry/index.js';
import { createNativePlugin } from '../../registry/native-plugin.js';
import type { NativeChartProps } from '../../registry/native-plugin.js';
import { createD3Plugin } from '../../plugins/d3-adapter.js';
import { createRechartsPlugin } from '../../plugins/recharts-adapter.js';
import { createNivoPlugin } from '../../plugins/nivo-adapter.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = {
  rows: [{ region: 'East', sales: 100 }, { region: 'West', sales: 200 }],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'sales', type: 'number' },
  ],
};

function renderWith(views: React.ComponentProps<typeof ViewSwitcher>['views']) {
  return render(
    <ThemeProvider theme="light">
      <ViewSwitcher views={views} data={data} width={300} height={200} />
    </ThemeProvider>,
  );
}

describe('adapter end-to-end: registerPlugin -> ViewSwitcher -> Renderer mounted', () => {
  beforeEach(() => {
    __resetRegistryForTests();
  });

  it('D3 plugin: mount is called via ViewSwitcher with adapted data and resolved dimensions', () => {
    const mount = vi.fn();
    const update = vi.fn();
    const destroy = vi.fn();
    registerPlugin(createD3Plugin({
      id: 'vsa-d3',
      dataAdapter: (d) => d.rows,
      mount,
      update,
      destroy,
    }));

    renderWith([{ id: 'vsa-d3' }]);

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount.mock.calls[0]?.[1]).toEqual(data.rows);
    expect(mount.mock.calls[0]?.[3]).toBe(300);
    expect(mount.mock.calls[0]?.[4]).toBe(200 - 36);
  });

  it('Recharts plugin: Renderer is mounted via ViewSwitcher with auto-detected data', () => {
    const Renderer = vi.fn(() => <div data-testid="recharts-out" />);
    registerPlugin(createRechartsPlugin({ id: 'vsa-recharts', Renderer }));

    renderWith([{ id: 'vsa-recharts' }]);

    expect(screen.getByTestId('recharts-out')).toBeInTheDocument();
    expect(Renderer).toHaveBeenCalledTimes(1);
    const props = Renderer.mock.calls[0]?.[0];
    expect(props?.data).toEqual([
      { region: 'East', sales: 100, name: 'East', value: 100 },
      { region: 'West', sales: 200, name: 'West', value: 200 },
    ]);
    expect(props?.width).toBe(300);
    expect(props?.height).toBe(200 - 36);
  });

  it('Nivo plugin: Renderer is mounted via ViewSwitcher with the configured dataAdapter output', () => {
    const Renderer = vi.fn(() => <div data-testid="nivo-out" />);
    registerPlugin(createNivoPlugin({
      id: 'vsa-nivo',
      dataAdapter: (d) => d.rows,
      Renderer,
    }));

    renderWith([{ id: 'vsa-nivo' }]);

    expect(screen.getByTestId('nivo-out')).toBeInTheDocument();
    expect(Renderer).toHaveBeenCalledTimes(1);
    const props = Renderer.mock.calls[0]?.[0];
    expect(props?.data).toEqual(data.rows);
    expect(props?.theme.colors).toEqual(lightTheme.colors.categorical);
  });

  it('Native plugin: wrapped component is mounted via ViewSwitcher with identity-adapted data/theme', () => {
    let received: NativeChartProps | undefined;
    function Capture(props: NativeChartProps) {
      received = props;
      return null;
    }
    registerPlugin(createNativePlugin('vsa-native', Capture));

    renderWith([{ id: 'vsa-native' }]);

    expect(received?.data).toBe(data);
    expect(received?.theme).toBe(lightTheme);
    expect(received?.width).toBe(300);
    expect(received?.height).toBe(200 - 36);
  });
});
