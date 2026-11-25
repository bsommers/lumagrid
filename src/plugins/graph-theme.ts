import type { ThemeDefinition } from '../theme/types.js';

/**
 * Engine-neutral graph styling tokens derived from a Lumagrid theme. Each graph engine adapter
 * (Reagraph, react-force-graph, R3F) reshapes these into its own theme or props.
 *
 * @beta
 * @experimental
 */
export interface GraphTheme {
  background: string;
  /** Categorical node colors, indexed by group. */
  nodeColors: string[];
  nodeDefault: string;
  edge: string;
  edgeActive: string;
  label: string;
  labelBackground: string;
  /** Selection / hover highlight. */
  highlight: string;
  fontFamily: string;
  fontSize: number;
}

/**
 * Maps a `ThemeDefinition` to {@link GraphTheme}.
 *
 * @beta
 * @experimental
 */
export function graphThemeAdapter(theme: ThemeDefinition): GraphTheme {
  const colors = theme.colors.categorical;
  return {
    background: theme.surface.background,
    nodeColors: colors,
    nodeDefault: colors[0] ?? theme.text.primary,
    edge: theme.surface.border,
    edgeActive: theme.text.secondary,
    label: theme.text.primary,
    labelBackground: theme.surface.surface,
    highlight: colors[1] ?? colors[0] ?? theme.text.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: parseInt(theme.typography.fontSizeSm, 10),
  };
}

/**
 * Callbacks shared by every graph plugin config.
 *
 * @beta
 * @experimental
 */
export interface GraphEvents {
  onNodeClick?: (node: { id: string; label: string }) => void;
  onSelectionChange?: (ids: string[]) => void;
}
