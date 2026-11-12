import React, { useEffect, useState } from 'react';
import type { ThemeDefinition, TransformedData } from 'lumagrid';
import { NATIVE_ID } from './engines/native';
import { PluginView, Panel, Segmented, Surface, salesFields, salesRows } from './common';

const HEIGHT = 300;

interface Engine { id: string; label: string; pluginId: string; load?: () => Promise<unknown> }
const ENGINES: readonly Engine[] = [
  { id: 'native', label: 'Native SVG', pluginId: NATIVE_ID },
  { id: 'd3', label: 'D3', pluginId: 'ex-d3', load: () => import('./engines/d3') },
  { id: 'recharts', label: 'Recharts', pluginId: 'ex-recharts', load: () => import('./engines/recharts') },
  { id: 'nivo', label: 'Nivo', pluginId: 'ex-nivo', load: () => import('./engines/nivo') },
];

/** One dataset: revenue per region (summed from the shared rows). */
const regionTotals: TransformedData = {
  rows: ['North', 'South', 'East', 'West'].map((region) => ({
    region,
    revenue: Math.round(salesRows.filter((r) => r['region'] === region).reduce((s, r) => s + Number(r['revenue']), 0) * 10) / 10,
  })),
  fields: salesFields.filter((f) => f.key === 'region' || f.key === 'revenue'),
};
/** One view config, shared by every engine. */
const VIEW_CONFIG = { labelField: 'region', valueField: 'revenue' };

function snippet(pluginId: string): string {
  return [
    '// Same data, same theme, same config. Only the plugin id changes:',
    'const config = { labelField: \'region\', valueField: \'revenue\' };',
    `<ViewSwitcher views={[{ id: '${pluginId}', config }]} data={data} />`,
  ].join('\n');
}

export function EngineSwitcher({ theme }: { theme: ThemeDefinition }): React.ReactElement {
  const [engineId, setEngineId] = useState('native');
  const [ready, setReady] = useState<ReadonlySet<string>>(new Set(['native']));
  const [failed, setFailed] = useState<string | null>(null);
  const engine = ENGINES.find((e) => e.id === engineId) ?? ENGINES[0]!;

  useEffect(() => {
    if (ready.has(engine.id) || !engine.load) return;
    let live = true;
    setFailed(null);
    engine.load().then(
      () => { if (live) setReady((s) => new Set(s).add(engine.id)); },
      () => { if (live) setFailed(engine.label); },
    );
    return () => { live = false; };
  }, [engine, ready]);

  const isReady = ready.has(engine.id);
  return (
    <Panel
      id="ex-engine"
      title="Engine switcher"
      lead="One dataset, one view config, one theme. Pick an engine and the chart is redrawn by that library through the plugin registry."
    >
      <Segmented label="Chart engine" name="ex-engine" options={ENGINES} value={engineId} onChange={setEngineId} />
      <p className="lg-ex-live" role="status" aria-live="polite">
        {failed ? `Could not load ${failed}.` : isReady ? `Showing revenue by region with ${engine.label}.` : `Loading ${engine.label}...`}
      </p>
      <Surface theme={theme} height={HEIGHT} label="engine">
        {(width) => isReady
          ? <PluginView id={engine.pluginId} data={regionTotals} theme={theme} config={VIEW_CONFIG} width={width} height={HEIGHT} />
          : <div className="lg-ex-note">Loading chart...</div>}
      </Surface>
      <pre className="lg-code" tabIndex={0}><code>{snippet(engine.pluginId)}</code></pre>
    </Panel>
  );
}
