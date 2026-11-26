import React from 'react';
import { GraphCanvas } from 'reagraph';
import type { LayoutTypes } from 'reagraph';
import { ViewSwitcher, registerPlugin } from 'lumagrid';
import { createReagraphPlugin } from 'lumagrid/plugins';
import { network } from '../../../examples/shared/demos';
import { EngineErrorBoundary, WebGLGate, usePrefersReducedMotion } from '../lib/webgl';
import type { DemoProps } from './types';

// #region code
// Reagraph needs React 19 (it bundles @react-three/fiber 9), so the canvas sits in an error boundary.
// Reagraph (WebGL) draws the network; Lumagrid supplies the graph data and the theme.
registerPlugin(createReagraphPlugin({
  id: 'gallery-reagraph',
  label: 'Network (Reagraph)',
  preset: 'reagraph-clustered',
  Renderer: ({ data, theme, width, height, config }) => {
    const reduced = usePrefersReducedMotion(); // no animated transitions for people who ask for less motion
    return (
      <div style={{ position: 'relative', width, height }}>
        <EngineErrorBoundary engine="Reagraph" requirement="Reagraph 4.x needs React 19.">
        <GraphCanvas
          nodes={data.nodes}
          edges={data.edges}
          theme={theme}
          animated={!reduced}
          layoutType={(config?.layoutType ?? 'forceDirected2d') as LayoutTypes}
          clusterAttribute={config?.clusterAttribute ?? 'group'}
        />
        </EngineErrorBoundary>
      </div>
    );
  },
}));

export default function ReagraphDemo({ width, height }: DemoProps): React.ReactElement {
  return (
    <WebGLGate width={width} height={height}>
      <ViewSwitcher views={[{ id: 'gallery-reagraph' }]} data={network} width={width} height={height} />
    </WebGLGate>
  );
}
// #endregion
