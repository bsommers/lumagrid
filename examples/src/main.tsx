import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'vizbox';
import type { TransformedData } from 'vizbox';
import {
  nativeBarPlugin,
  nativeLinePlugin,
  nativePiePlugin,
  nativeTablePlugin,
  nativeTreePlugin,
} from 'vizbox/viz';

// Register the plugins ViewSwitcher can choose between (once, at startup).
[nativeBarPlugin, nativeLinePlugin, nativePiePlugin, nativeTablePlugin, nativeTreePlugin].forEach(
  (p) => registerPlugin(p),
);

const sales: TransformedData = {
  rows: [
    { region: 'North', revenue: 12000 },
    { region: 'South', revenue: 14200 },
    { region: 'East', revenue: 9300 },
    { region: 'West', revenue: 11100 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'revenue', type: 'number' },
  ],
  hierarchy: {
    id: 'all',
    label: 'All regions',
    value: 46600,
    children: [
      { id: 'north', label: 'North', value: 12000 },
      { id: 'south', label: 'South', value: 14200 },
      { id: 'east', label: 'East', value: 9300 },
      { id: 'west', label: 'West', value: 11100 },
    ],
  },
};

const views = [
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'pie', label: 'Pie' },
  { id: 'table', label: 'Table' },
  { id: 'tree', label: 'Tree' },
];

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
