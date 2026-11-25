import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ViewSwitcher, registerPlugin } from 'lumagrid';
import { createForceGraphPlugin, themeRfgData } from 'lumagrid/plugins';
import { network } from '../../../examples/shared/demos';
import { WebGLGate, usePrefersReducedMotion } from '../lib/webgl';
import type { DemoProps } from './types';

// #region code
// react-force-graph owns the canvas; Lumagrid supplies the graph data and the theme.
registerPlugin(createForceGraphPlugin({
  id: 'gallery-rfg',
  variant: '2d',
  Renderer: ({ data, theme, width, height, config }) => {
    const graphData = useMemo(() => themeRfgData(data, theme), [data, theme]);
    return (
      <ForceGraph2D
        graphData={graphData}
        width={width}
        height={height}
        backgroundColor={theme.backgroundColor}
        linkColor={() => theme.linkColor}
        nodeLabel="name"
        cooldownTicks={config?.cooldownTicks ?? 100}
        linkDirectionalParticles={config?.particles ? 2 : 0}
        linkDirectionalParticleColor={() => theme.linkActiveColor}
      />
    );
  },
}));

export default function ForceGraphEngineDemo({ width, height }: DemoProps): React.ReactElement {
  const reduced = usePrefersReducedMotion();
  return (
    <WebGLGate width={width} height={height} kind="2d">
      <ViewSwitcher
        views={[{ id: 'gallery-rfg', config: { particles: !reduced, cooldownTicks: reduced ? 0 : 100 } }]}
        data={network}
        width={width}
        height={height}
      />
    </WebGLGate>
  );
}
// #endregion
