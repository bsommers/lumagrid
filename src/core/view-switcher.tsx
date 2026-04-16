import React, { useState } from 'react';
import { useTheme } from '../theme/provider.js';
import { getPlugin } from '../registry/index.js';
import type { ViewSpec } from '../registry/types.js';
import type { TransformedData } from '../transforms/types.js';

export interface ViewSwitcherProps {
  views: ViewSpec[];
  data: TransformedData;
  width: number;
  height: number;
  activeView?: string;
  onViewChange?: (id: string) => void;
  tabPosition?: 'top' | 'bottom';
}

export function ViewSwitcher({
  views, data, width, height,
  activeView: controlled, onViewChange, tabPosition = 'top',
}: ViewSwitcherProps): React.ReactElement {
  const theme = useTheme();
  const [internal, setInternal] = useState(views[0]?.id ?? '');
  const activeId = controlled ?? internal;
  const tabH = 36;
  const chartH = height - tabH;

  const handleSelect = (id: string) => { setInternal(id); onViewChange?.(id); };

  const activeSpec = views.find((v) => v.id === activeId) ?? views[0];
  const plugin = activeSpec ? getPlugin(activeSpec.id) : undefined;

  let chart: React.ReactNode;
  if (!plugin) {
    chart = (
      <div style={{ padding: theme.spacing.md, color: theme.text.secondary }}>
        No plugin registered for "{activeId}". Call registerPlugin(...) first.
      </div>
    );
  } else {
    const libData = plugin.dataAdapter(data, activeSpec?.config);
    const libTheme = plugin.themeAdapter(theme, activeSpec?.config);
    chart = (
      <plugin.Renderer
        data={libData}
        theme={libTheme}
        width={width}
        height={chartH}
        config={activeSpec?.config}
      />
    );
  }

  const tabStrip = (
    <div role="tablist" style={{
      display: 'flex', gap: theme.spacing.xs, height: tabH,
      padding: `0 ${theme.spacing.sm}`, alignItems: 'center',
      borderBottom: tabPosition === 'top' ? `1px solid ${theme.surface.border}` : undefined,
      borderTop: tabPosition === 'bottom' ? `1px solid ${theme.surface.border}` : undefined,
      background: theme.surface.surface, flexShrink: 0,
    }}>
      {views.map((v) => {
        const p = getPlugin(v.id);
        const label = v.label ?? p?.label ?? v.id;
        const active = v.id === activeId;
        return (
          <button key={v.id} role="tab" aria-selected={active}
            onClick={() => handleSelect(v.id)}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`, border: 'none',
              borderRadius: theme.surface.borderRadius, cursor: 'pointer',
              fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSizeSm,
              fontWeight: active ? theme.typography.fontWeightBold : theme.typography.fontWeightNormal,
              background: active ? (theme.colors.categorical[0] ?? 'transparent') : 'transparent',
              color: active ? theme.text.inverse : theme.text.secondary,
              transition: 'background 0.15s, color 0.15s',
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width, height }}>
      {tabPosition === 'top' && tabStrip}
      <div style={{ flex: 1, overflow: 'hidden' }}>{chart}</div>
      {tabPosition === 'bottom' && tabStrip}
    </div>
  );
}
