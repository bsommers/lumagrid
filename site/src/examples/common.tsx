import React, { useId } from 'react';
import { darkTheme, getPlugin, lightTheme } from 'lumagrid';
import type { DataRow, ThemeDefinition, TransformedData } from 'lumagrid';
import { lumagridTheme } from '../theme/lumagridTheme';
import { useWidth } from '../lib/useWidth';

export const THEME_OPTIONS: ReadonlyArray<{ id: string; label: string; theme: ThemeDefinition }> = [
  { id: 'neon', label: 'Neon', theme: lumagridTheme },
  { id: 'dark', label: 'Dark', theme: darkTheme },
  { id: 'light', label: 'Light', theme: lightTheme },
];

/** Shared dataset of the engine switcher and the dashboard. */
const REGIONS = ['North', 'South', 'East', 'West'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] as const;
const BASE = [12.0, 14.2, 9.3, 11.1];
export const salesRows: DataRow[] = REGIONS.flatMap((region, r) =>
  MONTHS.map((month, m) => ({
    region,
    month,
    revenue: Math.round(((BASE[r] ?? 10) + m * 0.7 + ((r * 3 + m * 5) % 4) * 0.35) * 10) / 10,
    units: 80 + r * 12 + m * 6 + ((r + m) % 3) * 4,
  })),
);
export const salesFields: TransformedData['fields'] = [
  { key: 'region', type: 'string' },
  { key: 'month', type: 'string' },
  { key: 'revenue', type: 'number' },
  { key: 'units', type: 'number' },
];

/** Renders a registered plugin through the registry: data adapter, theme adapter, Renderer. */
export function PluginView({ id, data, theme, config, width, height }: {
  id: string;
  data: TransformedData;
  theme: ThemeDefinition;
  config?: Record<string, unknown>;
  width: number;
  height: number;
}): React.ReactElement {
  const plugin = getPlugin(id);
  if (!plugin) return <p className="lg-ex-note">No plugin registered for "{id}".</p>;
  return (
    <plugin.Renderer
      data={plugin.dataAdapter(data, config)}
      theme={plugin.themeAdapter(theme, config)}
      width={width}
      height={height}
      config={config}
    />
  );
}

/** A measured chart surface painted with the theme background. */
export function Surface({ theme, height, label, children }: {
  theme: ThemeDefinition;
  height: number;
  label?: string;
  children: (width: number) => React.ReactNode;
}): React.ReactElement {
  const [ref, width] = useWidth<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="lg-ex-surface"
      data-lg-surface={label}
      style={{ background: theme.surface.background, minHeight: height }}
    >
      {children(width)}
    </div>
  );
}

/** Segmented control built from radios: arrow keys move, Tab leaves the group. */
export function Segmented({ label, name, options, value, onChange }: {
  label: string;
  name: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}): React.ReactElement {
  const uid = useId();
  return (
    <div role="radiogroup" aria-label={label} className="lg-ex-seg">
      {options.map((o) => (
        <label key={o.id} className="lg-ex-seg-opt">
          <input
            id={`${uid}-${o.id}`}
            type="radio"
            name={`${name}-${uid}`}
            value={o.id}
            checked={value === o.id}
            onChange={() => onChange(o.id)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export function Panel({ id, title, lead, children }: {
  id: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <article className="lg-ex-panel" aria-labelledby={`${id}-title`}>
      <header>
        <h3 id={`${id}-title`} className="lg-ex-panel-title">{title}</h3>
        <p className="lg-ex-lead">{lead}</p>
      </header>
      {children}
    </article>
  );
}
