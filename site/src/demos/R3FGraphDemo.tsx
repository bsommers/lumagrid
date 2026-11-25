import React from 'react';
import { ViewSwitcher, registerPlugin } from 'lumagrid';
import { createR3FGraphPlugin } from 'lumagrid/r3f';
import { network } from '../../../examples/shared/demos';
import { WebGLGate, usePrefersReducedMotion } from '../lib/webgl';
import type { DemoProps } from './types';

// #region code
// A seeded 3D force layout drawn with React Three Fiber (instanced nodes, line edges, labels).
registerPlugin(createR3FGraphPlugin({ id: 'gallery-r3f', layout: { seed: 7 } }));
// With reduced motion the layout settles almost at once instead of animating.
registerPlugin(createR3FGraphPlugin({ id: 'gallery-r3f-still', layout: { seed: 7, alphaDecay: 0.5, iterations: 60 } }));

export default function R3FGraphDemo({ width, height }: DemoProps): React.ReactElement {
  const reduced = usePrefersReducedMotion();
  return (
    <WebGLGate width={width} height={height}>
      <ViewSwitcher
        views={[{ id: reduced ? 'gallery-r3f-still' : 'gallery-r3f' }]}
        data={network}
        width={width}
        height={height}
      />
    </WebGLGate>
  );
}
// #endregion
