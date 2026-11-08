import React, { useState } from 'react';
import { CollapseManager } from 'lumagrid';
import { TreeView } from 'lumagrid/viz';
import { sales } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function TreeDemo({ width, height, theme }: DemoProps): React.ReactElement {
  // #region code
  const [selected, setSelected] = useState('nothing yet');
  const tree = (
    <CollapseManager defaultExpanded={['all']}>
      <TreeView
        data={sales}
        width={width}
        height={height - 44}
        theme={theme}
        onSelect={(node) => setSelected(node.label)}
      />
    </CollapseManager>
  );
  // #endregion
  return (
    <div>
      <p className="lg-demo-bar" style={{ color: theme.text.primary }}>Selected: <strong>{selected}</strong></p>
      {tree}
    </div>
  );
}
