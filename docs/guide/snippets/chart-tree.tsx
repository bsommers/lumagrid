// Source of the tree view page. Compiled by `npm run typecheck:site`,
// rendered by __tests__/charts.test.tsx and embedded verbatim in the markdown.

// #region tree
import { CollapseManager, groupBy, lightTheme } from 'lumagrid';
import type { HierarchyNode, TransformedData } from 'lumagrid';
import { TreeView } from 'lumagrid/viz';

const orders: TransformedData = {
  rows: [
    { region: 'North', revenue: 7200 },
    { region: 'North', revenue: 4800 },
    { region: 'South', revenue: 8100 },
    { region: 'East', revenue: 5300 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'revenue', type: 'number' },
  ],
};

// groupBy attaches a hierarchy: a root with one child per region, valued by summed revenue.
export const grouped = groupBy('region', 'revenue').transform(orders);

export function Example({ onPick }: { onPick?: (node: HierarchyNode) => void }) {
  return (
    // TreeView reads expand state from the nearest CollapseManager; defaultExpanded opens the root.
    <CollapseManager defaultExpanded={['root']}>
      <TreeView
        data={grouped}
        width={360}
        height={240}
        theme={lightTheme}
        {...(onPick ? { onSelect: onPick } : {})}
      />
    </CollapseManager>
  );
}
// #endregion

// #region tree-view
// The same chart as a ViewSwitcher view: register nativeTreePlugin, wrap the switcher
// in a CollapseManager, then name the view by id. The tree has no role field props.
export const treeView = { id: 'tree', label: 'Tree' };
// #endregion
