import React, { useMemo, useState } from 'react';
import { darkTheme } from 'lumagrid';
import type { ThemeDefinition } from 'lumagrid';
import { HorizontalBarChart, PieChart } from 'lumagrid/viz';
import { contrastRatio, wcagLevel } from '../lib/contrast';
import { Panel, Surface, salesFields, salesRows } from './common';

const H = 240;
const DEFAULTS = { accent: '#00e5ff', background: '#05070a', text: '#e6edf3' };

/** Region totals for the two playground charts. */
const totals = {
  rows: ['North', 'South', 'East', 'West'].map((region) => ({
    region,
    revenue: Math.round(salesRows.filter((r) => r['region'] === region).reduce((s, r) => s + Number(r['revenue']), 0) * 10) / 10,
  })),
  fields: salesFields.filter((f) => f.key === 'region' || f.key === 'revenue'),
};

export function buildTheme(accent: string, background: string, text: string): ThemeDefinition {
  return {
    ...darkTheme,
    name: 'custom',
    colors: { ...darkTheme.colors, categorical: [accent, ...darkTheme.colors.categorical.slice(1)] },
    surface: { ...darkTheme.surface, background, surface: background },
    text: { ...darkTheme.text, primary: text, secondary: text },
  };
}

function Readout({ label, ratio }: { label: string; ratio: number }): React.ReactElement {
  const level = wcagLevel(ratio);
  return (
    <li className={level === 'Fail' ? 'lg-ex-ratio lg-ex-ratio-fail' : 'lg-ex-ratio'}>
      {label}: <strong>{ratio.toFixed(2)}:1</strong> {level === 'Fail' ? 'fails WCAG AA (4.5:1)' : `passes WCAG ${level}`}
    </li>
  );
}

export function ThemePlayground(): React.ReactElement {
  const [colors, setColors] = useState(DEFAULTS);
  const theme = useMemo(() => buildTheme(colors.accent, colors.background, colors.text), [colors]);
  const textRatio = contrastRatio(colors.text, colors.background);
  const accentRatio = contrastRatio(colors.accent, colors.background);
  const set = (key: keyof typeof DEFAULTS) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setColors((c) => ({ ...c, [key]: e.target.value }));

  return (
    <Panel
      id="ex-theme"
      title="Theme playground"
      lead="Build a theme object from three colors. Both charts use it live, and the readout checks WCAG contrast."
    >
      <div className="lg-ex-colors">
        <div className="lg-ex-field"><label htmlFor="ex-theme-accent">Accent</label><input id="ex-theme-accent" type="color" value={colors.accent} onChange={set('accent')} /></div>
        <div className="lg-ex-field"><label htmlFor="ex-theme-bg">Background</label><input id="ex-theme-bg" type="color" value={colors.background} onChange={set('background')} /></div>
        <div className="lg-ex-field"><label htmlFor="ex-theme-text">Text</label><input id="ex-theme-text" type="color" value={colors.text} onChange={set('text')} /></div>
        <button type="button" className="lg-btn lg-btn-ghost" onClick={() => setColors(DEFAULTS)}>Reset</button>
      </div>
      <ul className="lg-ex-ratios" role="status" aria-live="polite" aria-label="Contrast readout">
        <Readout label="Text on background" ratio={textRatio} />
        <Readout label="Accent on background" ratio={accentRatio} />
      </ul>
      <div className="lg-ex-dash-grid">
        <div className="lg-ex-widget">
          <Surface theme={theme} height={H} label="theme-bar">
            {(w) => <HorizontalBarChart data={totals} width={w} height={H} theme={theme} labelField="region" valueField="revenue" ariaLabel="Revenue by region, custom theme" />}
          </Surface>
        </div>
        <div className="lg-ex-widget">
          <Surface theme={theme} height={H} label="theme-pie">
            {(w) => <PieChart data={totals} width={w} height={H} theme={theme} labelField="region" valueField="revenue" ariaLabel="Revenue share, custom theme" />}
          </Surface>
        </div>
      </div>
    </Panel>
  );
}
