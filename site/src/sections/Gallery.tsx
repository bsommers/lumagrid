import React, { Suspense, useState } from 'react';
import { ThemeProvider, darkTheme, lightTheme } from 'lumagrid';
import type { ThemeDefinition } from 'lumagrid/theme';
import { ChartCard } from '../components/ChartCard';
import { catalog } from '../demos/catalog';
import { lumagridTheme } from '../theme/lumagridTheme';
import './gallery.css';

const CHART_HEIGHT = 320;

const THEME_OPTIONS: ReadonlyArray<{ id: string; label: string; theme: ThemeDefinition }> = [
  { id: 'neon', label: 'Neon', theme: lumagridTheme },
  { id: 'dark', label: 'Dark', theme: darkTheme },
  { id: 'light', label: 'Light', theme: lightTheme },
];

/** Live, interactive charts: eleven native chart types and three adapter demos. */
export function Gallery(): React.ReactElement {
  const [themeId, setThemeId] = useState('neon');
  const theme = (THEME_OPTIONS.find((o) => o.id === themeId) ?? THEME_OPTIONS[0]!).theme;

  return (
    <section id="gallery" className="lg-gallery" aria-labelledby="gallery-title">
      <h2 id="gallery-title" className="lg-gallery-title">Gallery</h2>
      <p className="lg-gallery-lead">
        Every chart below is live. The code under each card is the file that draws it.
      </p>
      <div role="radiogroup" aria-label="Chart theme" className="lg-theme-toggle">
        {THEME_OPTIONS.map((o) => (
          <label key={o.id} className="lg-theme-option">
            <input
              type="radio"
              name="lg-chart-theme"
              value={o.id}
              checked={themeId === o.id}
              onChange={() => setThemeId(o.id)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      <div className="lg-gallery-grid">
        {catalog.map((entry) => (
          <ChartCard key={entry.id} title={entry.title} description={entry.description} code={entry.code}>
            {(width) => (
              <div
                className="lg-chart-surface"
                data-lg-surface={entry.id}
                style={{ background: theme.surface.background, minHeight: CHART_HEIGHT }}
              >
                <ThemeProvider theme={theme}>
                  <Suspense fallback={<div className="lg-loading" role="status">Loading chart...</div>}>
                    <entry.Component width={width} height={CHART_HEIGHT} theme={theme} />
                  </Suspense>
                </ThemeProvider>
              </div>
            )}
          </ChartCard>
        ))}
      </div>
    </section>
  );
}
