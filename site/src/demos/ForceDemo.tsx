import React, { useState } from 'react';
import { ForceGraph } from 'lumagrid/viz';
import { network } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function ForceDemo({ width, height, theme }: DemoProps): React.ReactElement {
  // #region code
  const [seed, setSeed] = useState(1);
  const chart = (
    <ForceGraph
      key={seed}
      data={network}
      width={width}
      height={height - 44}
      theme={theme}
      idField="id"
      labelField="label"
      seed={seed}
    />
  );
  const relayout = (
    <button type="button" onClick={() => setSeed(seed + 1)}>
      New layout
    </button>
  );
  // #endregion
  return (
    <div>
      <div className="lg-demo-bar" style={{ color: theme.text.primary }}>
        {relayout}
        <span style={{ color: theme.text.secondary }}>Seed {seed}</span>
      </div>
      {chart}
    </div>
  );
}
