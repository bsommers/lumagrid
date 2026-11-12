import React from 'react';
import { describe, expect, it } from 'vitest';
import { BarChart, Bar, XAxis } from 'recharts';
import { Bar as NivoBar } from '@nivo/bar';
import * as d3 from 'd3';
import { assertPluginConformance, checkPluginConformance } from '../index.js';
import {
  nativeBarPlugin,
  nativeChoroplethPlugin,
  nativeForceGraphPlugin,
  nativeLinePlugin,
  nativePiePlugin,
  nativeTablePlugin,
  nativeTreePlugin,
  nativeScatterPlugin,
  nativeAreaPlugin,
  nativeColumnPlugin,
  nativeHeatmapPlugin,
} from '../../viz/index.js';
import { CollapseManager } from '../../core/collapse-manager.js';
import { createD3Plugin, createNivoPlugin, createRechartsPlugin } from '../../plugins/index.js';

const natives = [
  nativeTablePlugin, nativeBarPlugin, nativeLinePlugin, nativePiePlugin,
  nativeTreePlugin, nativeChoroplethPlugin, nativeForceGraphPlugin,
  nativeScatterPlugin, nativeAreaPlugin, nativeColumnPlugin, nativeHeatmapPlugin,
];

describe('built-in native plugins conform', () => {
  for (const plugin of natives) {
    it(plugin.id, () => {
      const wrapper = plugin.id === 'tree'
        ? ({ children }: { children?: React.ReactNode }) => <CollapseManager>{children}</CollapseManager>
        : undefined;
      const report = checkPluginConformance(plugin, wrapper ? { wrapper } : {});
      report.checks = report.checks.filter((c) => c.status !== 'skip');
      expect(report.checks.filter((c) => c.status !== 'pass')).toEqual([]);
      expect(report.ok).toBe(true);
    });
  }
});

describe('adapters conform', () => {
  it('d3 (dom mode runs mount)', () => {
    const plugin = createD3Plugin({
      id: 'd3-bars',
      dataAdapter: (data) => data.rows,
      mount(el, data, theme, w, h) {
        d3.select(el).append('svg').attr('width', w).attr('height', h)
          .selectAll('rect').data(data).join('rect').attr('fill', theme.colors[0] ?? 'red');
      },
      update() {},
      destroy(el) {
        d3.select(el).selectAll('*').remove();
      },
    });
    expect(assertPluginConformance(plugin).ok).toBe(true);
  });

  it('d3 in server mode', () => {
    const plugin = createD3Plugin({ id: 'd3-s', dataAdapter: (d) => d.rows, mount() {}, update() {}, destroy() {} });
    expect(checkPluginConformance(plugin, { mode: 'server' }).ok).toBe(true);
  });

  it('recharts', () => {
    const plugin = createRechartsPlugin({
      id: 'rc',
      Renderer: ({ data, theme, width, height }) => (
        <div aria-label="Recharts bars" role="img">
          <BarChart width={width} height={height} data={data}>
            <XAxis dataKey="name" />
            <Bar dataKey="value" fill={theme.colors[0] ?? '#000'} isAnimationActive={false} />
          </BarChart>
        </div>
      ),
    });
    expect(checkPluginConformance(plugin).checks.filter((c) => c.status === 'fail')).toEqual([]);
  });

  it('nivo', () => {
    const plugin = createNivoPlugin<{ region: string; revenue: number }[]>({
      id: 'nv',
      dataAdapter: (d) => d.rows.map((r) => ({ region: String(r['region']), revenue: Number(r['revenue']) })),
      Renderer: ({ data, theme, width, height }) => (
        <div role="img" aria-label="Nivo bars">
          <NivoBar data={data} width={width} height={height} keys={['revenue']} indexBy="region" theme={theme} animate={false} />
        </div>
      ),
    });
    expect(checkPluginConformance(plugin).checks.filter((c) => c.status === 'fail')).toEqual([]);
  });
});
