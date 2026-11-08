import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import {
  nativeBarPlugin,
  nativeLinePlugin,
  nativePiePlugin,
  nativeTablePlugin,
  nativeTreePlugin,
} from 'lumagrid/viz';
import { sales, views } from '../shared/demos';

// Register the plugins ViewSwitcher can choose between (once, at startup).
[nativeBarPlugin, nativeLinePlugin, nativePiePlugin, nativeTablePlugin, nativeTreePlugin].forEach(
  (p) => registerPlugin(p),
);

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
      </div>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
