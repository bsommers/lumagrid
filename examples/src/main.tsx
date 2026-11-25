import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import {
  nativeBarPlugin,
  nativeLinePlugin,
  nativePiePlugin,
  nativeTablePlugin,
  nativeTreePlugin,
} from 'lumagrid/viz';
import ForceGraph2D from 'react-force-graph-2d';
import { createForceGraphPlugin, themeRfgData } from 'lumagrid/plugins';
import { network, sales, views } from '../shared/demos';

// Register the plugins ViewSwitcher can choose between (once, at startup).
[nativeBarPlugin, nativeLinePlugin, nativePiePlugin, nativeTablePlugin, nativeTreePlugin].forEach(
  (p) => registerPlugin(p),
);

// Network example: react-force-graph draws, Lumagrid supplies the graph data and the theme.
registerPlugin(createForceGraphPlugin({
  id: 'example-network',
  variant: '2d',
  Renderer: ({ data, theme, width, height }) => {
    const graphData = useMemo(() => themeRfgData(data, theme), [data, theme]);
    return (
      <ForceGraph2D
        graphData={graphData}
        width={width}
        height={height}
        backgroundColor={theme.backgroundColor}
        linkColor={() => theme.linkColor}
        nodeLabel="name"
        cooldownTicks={100}
      />
    );
  },
}));

function App(): React.ReactElement {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  return (
    <ThemeProvider theme={mode}>
      <div style={{ padding: 24, minHeight: '100vh', boxSizing: 'border-box',
        background: mode === 'dark' ? '#0b0f14' : '#f4f5f7' }}>
        <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} style={{ marginBottom: 16 }}>
          Theme: {mode}
        </button>
        <WidgetContainer data={sales} title="Revenue by region" width={640} height={420}>
          {(data, width, height) => (
            <ViewSwitcher views={views} data={data} width={width} height={height} />
          )}
        </WidgetContainer>
        <div style={{ height: 24 }} />
        <WidgetContainer data={network} title="Module network" width={640} height={420}>
          {(data, width, height) => (
            <ViewSwitcher views={[{ id: 'example-network' }]} data={data} width={width} height={height} />
          )}
        </WidgetContainer>
      </div>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
