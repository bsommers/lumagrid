// Source of the React Three Fiber sections of the r3f guide. Compiled by `npm run typecheck:site`.

// #region r3f-plugin
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createR3FGraphPlugin } from 'lumagrid/r3f';

// Composes the four primitives inside a Canvas. The seed makes the layout repeatable.
registerPlugin(createR3FGraphPlugin({ layout: { seed: 7 }, showLabels: true }));

const network: TransformedData = {
  rows: [
    { id: 'a', label: 'Alpha', group: 'x' },
    { id: 'b', label: 'Beta', group: 'x' },
    { id: 'c', label: 'Gamma', group: 'y' },
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' },
  ],
  fields: [
    { key: 'id', type: 'string' },
    { key: 'label', type: 'string' },
    { key: 'group', type: 'string' },
    { key: 'source', type: 'string' },
    { key: 'target', type: 'string' },
  ],
};

export function Example() {
  return (
    <ThemeProvider theme="dark">
      <WidgetContainer data={network} title="3D network" width={600} height={400}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'r3f-graph' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
// #endregion

// #region r3f-scene
import { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { toGraph } from 'lumagrid/transforms';
import { graphThemeAdapter } from 'lumagrid/plugins';
import { lightTheme } from 'lumagrid/theme';
import { CameraRig, EdgeLines, InstancedNodes, NodeLabels, useForceLayout3D } from 'lumagrid/r3f';

const graph = toGraph(network);
const graphTheme = graphThemeAdapter(lightTheme);

// The layout hook updates one stable Map in place; advance it once per frame.
function Scene() {
  const { positions, tick } = useForceLayout3D(graph, { seed: 7 });
  const [selected, setSelected] = useState<string | null>(null);
  useFrame(tick);
  return (
    <>
      <color attach="background" args={[graphTheme.background]} />
      <ambientLight intensity={0.8} />
      <EdgeLines graph={graph} positions={positions} theme={graphTheme} />
      <InstancedNodes
        graph={graph}
        positions={positions}
        theme={graphTheme}
        selectedId={selected}
        onNodeClick={(node) => setSelected(node.id)}
      />
      <NodeLabels graph={graph} positions={positions} theme={graphTheme} maxLabels={50} />
      <CameraRig positions={positions} focusId={selected} />
    </>
  );
}

export function CustomScene() {
  return (
    <Canvas camera={{ position: [0, 0, 120], fov: 50 }} style={{ width: 600, height: 400 }}>
      <Scene />
    </Canvas>
  );
}
// #endregion

// #region to-graph
import { graphSampleData } from 'lumagrid/testing';

const sampleGraph = toGraph(graphSampleData, { maxNodes: 100 });
// sampleGraph.nodes: { id, label, group?, degree, data? }[]
// sampleGraph.links: { id, source, target, weight? }[]
// sampleGraph.dropped: rows or edges that were skipped
// #endregion

// #region r3f-layout
import { layoutGraph3D } from 'lumagrid/r3f';

// Same graph and options, same positions: Map<id, [x, y, z]>.
export const positions = layoutGraph3D(sampleGraph, { seed: 7 });
// #endregion
