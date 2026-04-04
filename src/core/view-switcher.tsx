import React, { useState } from 'react';
import { useTheme } from '../theme/provider.js';
import { getVisualization } from './registry.js';
import type { VisualizationProps } from '../viz/types.js';

export interface ViewSwitcherProps {
  /** Registered visualization keys to switch between. */
  views: string[];
  /** Data and sizing passed through to the active visualization. */
  vizProps: VisualizationProps;
  /** Controlled: currently active view key. */
  activeView?: string;
  /** Called when the user switches views. */
  onViewChange?: (view: string) => void;
  /** Where to render the tab strip. Default: 'top'. */
  tabPosition?: 'top' | 'bottom';
}

export function ViewSwitcher({
  views,
  vizProps,
  activeView: controlledView,
  onViewChange,
  tabPosition = 'top',
}: ViewSwitcherProps): React.ReactElement {
  const theme = useTheme();
  const [internalView, setInternalView] = useState<string>(views[0] ?? '');
  const activeView = controlledView ?? internalView;

  const handleSelect = (view: string) => {
    setInternalView(view);
    onViewChange?.(view);
  };

  const ActiveComponent = getVisualization(activeView);

  const tabStrip = (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: theme.spacing.xs,
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        borderBottom: tabPosition === 'top' ? `1px solid ${theme.surface.border}` : undefined,
        borderTop: tabPosition === 'bottom' ? `1px solid ${theme.surface.border}` : undefined,
        background: theme.surface.surface,
      }}
    >
      {views.map((view) => (
        <button
          key={view}
          role="tab"
          aria-selected={view === activeView}
          onClick={() => handleSelect(view)}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            border: 'none',
            borderRadius: theme.surface.borderRadius,
            cursor: 'pointer',
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSizeSm,
            fontWeight: view === activeView ? theme.typography.fontWeightBold : theme.typography.fontWeightNormal,
            background: view === activeView ? theme.colors.categorical[0] ?? 'transparent' : 'transparent',
            color: view === activeView ? theme.text.inverse : theme.text.secondary,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {view}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {tabPosition === 'top' && tabStrip}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {ActiveComponent ? (
          <ActiveComponent {...vizProps} />
        ) : (
          <div style={{ padding: theme.spacing.md, color: theme.text.secondary }}>
            No visualization registered for "{activeView}".
            Call registerVisualization("{activeView}", YourComponent) first.
          </div>
        )}
      </div>
      {tabPosition === 'bottom' && tabStrip}
    </div>
  );
}
