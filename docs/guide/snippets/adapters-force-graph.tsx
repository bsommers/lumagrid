// Source of the react-force-graph section of the graph guide. Compiled by `npm run typecheck:site`.

// #region force-graph
import { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createForceGraphPlugin, themeRfgData } from 'lumagrid/plugins';

// The app owns the engine: Lumagrid supplies data, theme and size.
registerPlugin(
  createForceGraphPlugin({
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
  }),
);

const network: TransformedData = {
  rows: [
    { id: 'a', label: 'Alpha', group: 'x' },
    { id: 'b', label: 'Beta', group: 'x' },
    { id: 'c', label: 'Gamma', group: 'y' },
    { source: 'a', target: 'b', weight: 2 },
    { source: 'b', target: 'c', weight: 1 },
  ],
  fields: [
    { key: 'id', type: 'string' },
    { key: 'label', type: 'string' },
    { key: 'group', type: 'string' },
    { key: 'source', type: 'string' },
    { key: 'target', type: 'string' },
    { key: 'weight', type: 'number' },
  ],
};

export function Example() {
  return (
    <ThemeProvider theme="dark">
      <WidgetContainer data={network} title="Network" width={600} height={400}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'rfg-2d', config: { particles: true } }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
// #endregion
