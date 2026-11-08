import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CollapseManager, ThemeProvider, useTheme, lightTheme, darkTheme } from 'lumagrid';
import {
  HorizontalBarChart, LineChart, PieChart, ForceGraph, Choropleth, DataTable, TreeView,
} from 'lumagrid/viz';
import { demoViews, hexProjectedPaths } from '../../examples/shared/demos';

/** Charts the capture page can render, in display order. */
export const CAPTURE_CHARTS = ['bar', 'line', 'pie', 'force', 'choropleth', 'table', 'tree'] as const;
export type CaptureChart = (typeof CAPTURE_CHARTS)[number];

const CAPTURE_THEMES = ['light', 'dark'] as const;
type CaptureTheme = (typeof CAPTURE_THEMES)[number];

export const CAPTURE_WIDTH = 640;
export const CAPTURE_HEIGHT = 400;

export type CaptureParams =
  | { ok: true; chart: CaptureChart; theme: CaptureTheme; seed: number }
  | { ok: false };

/**
 * Parse the capture query string against fixed allow-lists. Anything outside the
 * allow-lists (or a seed that is not a non-negative integer) is an error marker;
 * the raw values are never returned.
 */
export function parseCaptureParams(search: string): CaptureParams {
  const q = new URLSearchParams(search);
  const chart = (CAPTURE_CHARTS as readonly string[]).find((c) => c === q.get('chart'));
  const theme = (CAPTURE_THEMES as readonly string[]).find((t) => t === (q.get('theme') ?? 'light'));
  const seedText = q.get('seed') ?? '1';
  if (chart === undefined || theme === undefined || !/^\d{1,9}$/.test(seedText)) return { ok: false };
  return { ok: true, chart: chart as CaptureChart, theme: theme as CaptureTheme, seed: Number(seedText) };
}

function useCaptureReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    const fontsReady: Promise<unknown> = fonts?.ready ?? Promise.resolve();
    void fontsReady.then(() => {
      if (cancelled) return;
      frame = requestAnimationFrame(() => {
        if (!cancelled) setReady(true);
      });
    });
    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return ready;
}

function Chart(
  { chart, seed, width, height }: { chart: CaptureChart; seed: number; width: number; height: number },
): React.ReactElement {
  const theme = useTheme();
  const { data, config } = demoViews[chart];
  const common = { data, width, height, theme, ...config };
  switch (chart) {
    case 'bar':
      return <HorizontalBarChart {...common} />;
    case 'line':
      return <LineChart {...common} />;
    case 'pie':
      return <PieChart {...common} />;
    case 'force':
      return <ForceGraph {...common} seed={seed} />;
    case 'choropleth':
      return <Choropleth {...common} projectedPaths={hexProjectedPaths(width, height)} />;
    case 'table':
      return <DataTable {...common} />;
    case 'tree':
      return (
        <CollapseManager defaultExpanded={['all']}>
          <TreeView {...common} />
        </CollapseManager>
      );
  }
}

/** Renders one chart (or a fixed error message) for the given query string. */
export function CaptureApp({ search }: { search: string }): React.ReactElement {
  const params = parseCaptureParams(search);
  const ready = useCaptureReady();
  if (!params.ok) {
    return <p role="alert">Invalid capture request.</p>;
  }
  const theme = params.theme === 'dark' ? darkTheme : lightTheme;
  return (
    <ThemeProvider theme={theme}>
      <div
        id="capture"
        {...(ready ? { 'data-capture-ready': '1' } : {})}
        style={{
          width: CAPTURE_WIDTH,
          height: CAPTURE_HEIGHT,
          overflow: 'hidden',
          background: theme.surface.background,
        }}
      >
        <Chart chart={params.chart} seed={params.seed} width={CAPTURE_WIDTH} height={CAPTURE_HEIGHT} />
      </div>
    </ThemeProvider>
  );
}

const mountNode = typeof document !== 'undefined' ? document.getElementById('capture-root') : null;
if (mountNode) {
  createRoot(mountNode).render(<CaptureApp search={window.location.search} />);
}
