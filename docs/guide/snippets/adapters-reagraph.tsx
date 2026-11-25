// Source of the Reagraph section of plugins-and-adapters.md. Compiled by `npm run typecheck:site`.

// #region reagraph-network
import { GraphCanvas } from 'reagraph';
import type { LayoutTypes } from 'reagraph';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createReagraphPlugin } from 'lumagrid/plugins';

// Presets: 'reagraph-2d', 'reagraph-3d' and 'reagraph-clustered' only set config defaults.
const reagraphPlugin = createReagraphPlugin({
  id: 'reagraph-network',
  label: 'Network (Reagraph)',
  preset: 'reagraph-clustered',
  Renderer: ({ data, theme, width, height, config }) => (
    <div style={{ position: 'relative', width, height }}>
      <GraphCanvas
        nodes={data.nodes}
        edges={data.edges}
        theme={theme}
        layoutType={(config?.layoutType ?? 'forceDirected2d') as LayoutTypes}
        clusterAttribute={config?.clusterAttribute ?? 'group'}
      />
    </div>
  ),
});

registerPlugin(reagraphPlugin);

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
    <ThemeProvider theme="light">
      <WidgetContainer data={network} title="Reagraph network" width={600} height={400}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'reagraph-network' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
// #endregion
