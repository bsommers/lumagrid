import React, { useState } from 'react';
import { THEME_OPTIONS } from '../examples/common';
import { EngineSwitcher } from '../examples/EngineSwitcher';
import { Dashboard } from '../examples/Dashboard';
import { CsvToChart } from '../examples/CsvToChart';
import { ThemePlayground } from '../examples/ThemePlayground';
import './examples.css';

/** Real-world use: engine switching, a dashboard, CSV to chart and a theme playground. */
export function Examples(): React.ReactElement {
  const [themeId, setThemeId] = useState('neon');
  const theme = (THEME_OPTIONS.find((o) => o.id === themeId) ?? THEME_OPTIONS[0]!).theme;
  return (
    <section id="examples" className="lg-ex" aria-labelledby="examples-title">
      <h2 id="examples-title" className="lg-ex-title">Examples</h2>
      <p className="lg-ex-lead">Four small apps built only from the library: swap engines, filter a dashboard, chart your own CSV and design a theme.</p>
      <div role="radiogroup" aria-label="Examples theme" className="lg-ex-themes">
        {THEME_OPTIONS.map((o) => (
          <label key={o.id} className="lg-ex-seg-opt">
            <input type="radio" name="lg-ex-theme" value={o.id} checked={themeId === o.id} onChange={() => setThemeId(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      <div className="lg-ex-stack">
        <EngineSwitcher theme={theme} />
        <Dashboard theme={theme} />
        <CsvToChart theme={theme} />
        <ThemePlayground />
      </div>
    </section>
  );
}
