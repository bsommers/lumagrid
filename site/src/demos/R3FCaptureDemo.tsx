import React from 'react';
import { ViewSwitcher, registerPlugin } from 'lumagrid';
import { createR3FGraphPlugin } from 'lumagrid/r3f';
import interFont from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import { network } from '../../../examples/shared/demos';
import { WebGLGate } from '../lib/webgl';
import type { DemoProps } from './types';

// Capture-only variant of R3FGraphDemo: seeded, settled layout with self-hosted Inter labels.
registerPlugin(createR3FGraphPlugin({
  id: 'capture-r3f',
  layout: { seed: 7, alphaDecay: 0.5, iterations: 60 },
  labelFont: interFont,
}));

export default function R3FCaptureDemo({ width, height }: DemoProps): React.ReactElement {
  return (
    <WebGLGate width={width} height={height}>
      <ViewSwitcher views={[{ id: 'capture-r3f' }]} data={network} width={width} height={height} />
    </WebGLGate>
  );
}
