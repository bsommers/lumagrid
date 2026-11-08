import { describe, it, expect } from 'vitest';
import * as root from '../index.js';
import * as core from '../core/index.js';
import * as viz from '../viz/index.js';
import * as plugins from '../plugins/index.js';
import * as theme from '../theme/index.js';
import * as transforms from '../transforms/index.js';
import {
  nativeBarPlugin,
  nativeLinePlugin,
  nativePiePlugin,
  nativeTablePlugin,
  nativeTreePlugin,
  nativeChoroplethPlugin,
  nativeForceGraphPlugin,
} from '../viz/plugins.js';

// Guards the package export map: every runtime symbol each entry point is
// expected to expose. A removed or renamed export fails here before it ships.
const expected: Record<string, [Record<string, unknown>, string[]]> = {
  'lumagrid': [root, [
    'ThemeProvider', 'useTheme', 'lightTheme', 'darkTheme',
    'categoricalColor', 'sequentialColor', 'divergingColor', 'thresholdScale',
    'flatten', 'aggregate', 'pivot', 'groupBy', 'geoNormalize', 'TransformPipeline',
    'registerPlugin', 'getPlugin', 'listPlugins', 'registerAndGetId', 'createNativePlugin',
    'WidgetContainer', 'ViewSwitcher', 'CollapseManager', 'useCollapse',
    'DataTable', 'HorizontalBarChart', 'LineChart', 'PieChart', 'Choropleth', 'ForceGraph', 'TreeView',
    'createD3Plugin', 'createRechartsPlugin', 'createNivoPlugin',
  ]],
  'lumagrid/core': [core, [
    'WidgetContainer', 'ViewSwitcher', 'CollapseManager', 'useCollapse',
    'registerPlugin', 'getPlugin', 'listPlugins', 'registerAndGetId', 'createNativePlugin',
  ]],
  'lumagrid/viz': [viz, [
    'DataTable', 'HorizontalBarChart', 'LineChart', 'PieChart', 'Choropleth', 'ForceGraph', 'TreeView',
    'nativeBarPlugin', 'nativeLinePlugin', 'nativePiePlugin', 'nativeTablePlugin',
    'nativeTreePlugin', 'nativeChoroplethPlugin', 'nativeForceGraphPlugin',
  ]],
  'lumagrid/plugins': [plugins, [
    'createD3Plugin', 'createRechartsPlugin', 'rechartsThemeAdapter', 'createNivoPlugin', 'nivoThemeAdapter',
  ]],
  'lumagrid/theme': [theme, ['ThemeProvider', 'useTheme', 'lightTheme', 'darkTheme']],
  'lumagrid/transforms': [transforms, ['flatten', 'aggregate', 'pivot', 'groupBy', 'geoNormalize', 'TransformPipeline']],
};

describe('entry-point barrels', () => {
  for (const [entry, [mod, names]] of Object.entries(expected)) {
    it(`${entry} exposes its runtime exports`, () => {
      for (const name of names) {
        expect(mod[name], `${entry} missing ${name}`).toBeDefined();
      }
    });
  }

  it('root barrel re-exports the same instances as the subpath entries', () => {
    expect(root.ViewSwitcher).toBe(core.ViewSwitcher);
    expect(root.registerPlugin).toBe(core.registerPlugin);
    expect(root.LineChart).toBe(viz.LineChart);
    expect(root.createD3Plugin).toBe(plugins.createD3Plugin);
    expect(root.lightTheme).toBe(theme.lightTheme);
    expect(root.pivot).toBe(transforms.pivot);
  });
});

describe('native plugin presets', () => {
  const presets = [
    [nativeTablePlugin, 'table', 'Table', viz.DataTable],
    [nativeBarPlugin, 'bar', 'Bar Chart', viz.HorizontalBarChart],
    [nativeLinePlugin, 'line', 'Line Chart', viz.LineChart],
    [nativePiePlugin, 'pie', 'Pie Chart', viz.PieChart],
    [nativeChoroplethPlugin, 'choropleth', 'Choropleth', viz.Choropleth],
    [nativeForceGraphPlugin, 'force-graph', 'Force Graph', viz.ForceGraph],
    [nativeTreePlugin, 'tree', 'Tree', viz.TreeView],
  ] as const;

  it.each(presets)('%#: has the expected id and label with identity adapters', (plugin, id, label) => {
    expect(plugin.id).toBe(id);
    expect(plugin.label).toBe(label);
    const data = { rows: [], fields: [] };
    expect(plugin.dataAdapter(data)).toBe(data);
    expect(plugin.themeAdapter(theme.lightTheme)).toBe(theme.lightTheme);
  });

  it('preset ids are unique', () => {
    const ids = presets.map(([p]) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
