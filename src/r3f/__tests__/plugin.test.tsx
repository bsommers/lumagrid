import React from 'react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ style }: { style?: React.CSSProperties }) => <div data-testid="canvas" style={style} />,
  useFrame: () => undefined,
  useThree: () => ({}),
}));
vi.mock('@react-three/drei', () => ({ Text: () => null }));

import { createR3FGraphPlugin } from '../plugin.js';
import { assertPluginConformance, graphSampleData } from '../../testing/index.js';
import { lightTheme } from '../../theme/light.js';

describe('createR3FGraphPlugin', () => {
  const plugin = createR3FGraphPlugin();
  it('has the plugin shape', () => {
    expect(plugin.id).toBe('r3f-graph');
    expect(typeof plugin.dataAdapter).toBe('function');
    expect(typeof plugin.themeAdapter).toBe('function');
    expect(plugin.Renderer).toBeTruthy();
    expect(plugin.dataAdapter(graphSampleData).nodes).toHaveLength(4);
    expect(plugin.themeAdapter(lightTheme).background).toBe(lightTheme.surface.background);
  });
  it('passes conformance with a mocked Canvas', () => {
    const report = assertPluginConformance(plugin, {
      data: graphSampleData,
      skip: { 'theme-switch': 'WebGL scene is not rendered in jsdom; theme adapter is covered by graphThemeAdapter tests' },
    });
    expect(report.ok).toBe(true);
    expect(report.checks.find((c) => c.id === 'theme-switch')?.status).toBe('skip');
  });
});
