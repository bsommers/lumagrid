import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createNativePlugin } from '../native-plugin.js';
import type { NativeChartProps } from '../native-plugin.js';
import { lightTheme } from '../../theme/light.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = { rows: [{ x: 1 }], fields: [{ key: 'x', type: 'number' }] };

describe('createNativePlugin identity adapters', () => {
  it('dataAdapter passes TransformedData through unchanged', () => {
    const plugin = createNativePlugin('native-test-a', () => null);
    expect(plugin.dataAdapter(data)).toBe(data);
  });

  it('themeAdapter passes ThemeDefinition through unchanged', () => {
    const plugin = createNativePlugin('native-test-b', () => null);
    expect(plugin.themeAdapter(lightTheme)).toBe(lightTheme);
  });

  it('defaults label to id', () => {
    const plugin = createNativePlugin('native-test-c', () => null);
    expect(plugin.label).toBe('native-test-c');
  });

  it('uses the provided label when given', () => {
    const plugin = createNativePlugin('native-test-d', () => null, 'My Chart');
    expect(plugin.label).toBe('My Chart');
  });
});

describe('createNativePlugin Renderer', () => {
  let received: NativeChartProps[] = [];

  function Capture(props: NativeChartProps) {
    received.push(props);
    return null;
  }

  it('spreads config onto the wrapped component', () => {
    received = [];
    const plugin = createNativePlugin('native-test-e', Capture);
    render(
      <plugin.Renderer
        data={data}
        theme={lightTheme}
        width={100}
        height={50}
        config={{ xField: 'x', ariaLabel: 'my chart' }}
      />,
    );
    expect(received[0]?.xField).toBe('x');
    expect(received[0]?.ariaLabel).toBe('my chart');
  });

  it('never lets a colliding config key override the real data/theme/width/height props', () => {
    received = [];
    const plugin = createNativePlugin('native-test-f', Capture);
    const evilConfig = { data: 'clobbered', theme: 'clobbered', width: -1, height: -1 } as unknown as Record<string, unknown>;
    render(
      <plugin.Renderer data={data} theme={lightTheme} width={100} height={50} config={evilConfig} />,
    );
    expect(received[0]?.data).toBe(data);
    expect(received[0]?.theme).toBe(lightTheme);
    expect(received[0]?.width).toBe(100);
    expect(received[0]?.height).toBe(50);
  });
});
