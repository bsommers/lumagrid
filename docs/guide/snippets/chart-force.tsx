// Source of the force graph page. Compiled by `npm run typecheck:site`,
// rendered by __tests__/charts.test.tsx and embedded verbatim in the markdown.

// #region force
import { lightTheme } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { ForceGraph } from 'lumagrid/viz';

// Node rows carry id and label (and an optional group that sets the color).
// Rows with a source column are edges: source and target are node ids, weight is optional.
export const network: TransformedData = {
  rows: [
    { id: 'core', label: 'Core', group: 'platform' },
    { id: 'theme', label: 'Theme', group: 'platform' },
    { id: 'bar', label: 'Bar', group: 'viz' },
    { id: 'line', label: 'Line', group: 'viz' },
    { source: 'core', target: 'theme', weight: 2 },
    { source: 'core', target: 'bar' },
    { source: 'theme', target: 'bar' },
    { source: 'theme', target: 'line' },
  ],
  fields: [
    { key: 'id', type: 'string' },
    { key: 'label', type: 'string' },
    { key: 'group', type: 'string' },
    { key: 'source', type: 'string' },
    { key: 'target', type: 'string' },
    { key: 'weight', type: 'number' },
  ],
};

// idField and labelField name the node columns. seed and iterations are experimental.
export function Example() {
  return (
    <ForceGraph
      data={network}
      width={600}
      height={360}
      theme={lightTheme}
      idField="id"
      labelField="label"
      seed={1}
      iterations={60}
      ariaLabel="Module dependency graph"
    />
  );
}
// #endregion

// #region force-view
// The same chart as a ViewSwitcher view: register nativeForceGraphPlugin, then name it by id.
export const forceView = {
  id: 'force-graph',
  label: 'Network',
  config: { idField: 'id', labelField: 'label', seed: 1 },
};
// #endregion
