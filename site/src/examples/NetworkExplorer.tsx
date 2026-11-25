import React, { Suspense, lazy, useMemo, useState } from 'react';
import { ThemeProvider } from 'lumagrid';
import type { ThemeDefinition } from 'lumagrid';
import { Panel, Segmented, Surface } from './common';
import { extractRegion } from '../lib/region';
import reagraphSource from '../demos/ReagraphDemo.tsx?raw';
import forceSource from '../demos/ForceGraphEngineDemo.tsx?raw';
import r3fSource from '../demos/R3FGraphDemo.tsx?raw';

const HEIGHT = 340;

const ENGINES = [
  { id: 'reagraph', label: 'Reagraph', Demo: lazy(() => import('../demos/ReagraphDemo')), code: extractRegion(reagraphSource, 'code') },
  { id: 'force', label: 'force-graph', Demo: lazy(() => import('../demos/ForceGraphEngineDemo')), code: extractRegion(forceSource, 'code') },
  { id: 'r3f', label: '3D (R3F)', Demo: lazy(() => import('../demos/R3FGraphDemo')), code: extractRegion(r3fSource, 'code') },
] as const;

/** One network dataset, three engines: the plugin owns data and theme, the engine owns drawing. */
export function NetworkExplorer({ theme }: { theme: ThemeDefinition }): React.ReactElement {
  const [engineId, setEngineId] = useState<string>('reagraph');
  const engine = useMemo(() => ENGINES.find((e) => e.id === engineId) ?? ENGINES[0], [engineId]);
  return (
    <Panel
      id="ex-network"
      title="Network explorer"
      lead="One node and edge dataset, one theme. Pick an engine; each is loaded only when you choose it."
    >
      <Segmented label="Network engine" name="ex-network" options={ENGINES} value={engine.id} onChange={setEngineId} />
      <Surface theme={theme} height={HEIGHT} label="network">
        {(width) => (
          <ThemeProvider theme={theme}>
            <Suspense fallback={<div className="lg-ex-note" role="status">Loading network...</div>}>
              <engine.Demo width={width} height={HEIGHT} theme={theme} />
            </Suspense>
          </ThemeProvider>
        )}
      </Surface>
      <pre className="lg-code" tabIndex={0}><code>{engine.code}</code></pre>
    </Panel>
  );
}
