import React from 'react';
import { useTheme } from '../theme/provider.js';
import { useCollapse } from '../core/collapse-manager.js';
import type { VisualizationProps } from './types.js';
import type { HierarchyNode } from '../transforms/types.js';

interface TreeNodeProps {
  node: HierarchyNode;
  depth: number;
  onSelect: ((node: HierarchyNode) => void) | undefined;
}

function TreeNodeRow({ node, depth, onSelect }: TreeNodeProps): React.ReactElement {
  const theme = useTheme();
  const collapse = useCollapse();
  const hasChildren = node.children && node.children.length > 0;
  const expanded = collapse.isExpanded(node.id);

  const indent = depth * parseInt(theme.spacing.lg);

  return (
    <>
      <div
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          paddingLeft: indent,
          paddingTop: theme.spacing.xs,
          paddingBottom: theme.spacing.xs,
          paddingRight: theme.spacing.sm,
          cursor: hasChildren ? 'pointer' : 'default',
          userSelect: 'none',
          borderRadius: theme.surface.borderRadius,
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = theme.surface.surface; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        onClick={() => {
          if (hasChildren) collapse.toggle(node.id);
          onSelect?.(node);
        }}
      >
        <span style={{ width: 16, flexShrink: 0, color: theme.text.secondary, fontSize: 10 }}>
          {hasChildren ? (expanded ? '▼' : '▶') : ''}
        </span>
        <span style={{ flex: 1, fontSize: theme.typography.fontSizeBase, color: theme.text.primary }}>
          {node.label}
        </span>
        {node.value !== undefined && (
          <span style={{ fontSize: theme.typography.fontSizeSm, color: theme.text.secondary }}>
            {node.value.toLocaleString()}
          </span>
        )}
      </div>
      {hasChildren && expanded && node.children?.map((child) => (
        <TreeNodeRow key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
      ))}
    </>
  );
}

export interface TreeViewProps extends VisualizationProps {
  onSelect?: (node: HierarchyNode) => void;
}

export function TreeView({ data, height, onSelect }: TreeViewProps): React.ReactElement {
  const theme = useTheme();

  if (!data.hierarchy) {
    return (
      <div style={{ padding: theme.spacing.md, color: theme.text.secondary, fontFamily: theme.typography.fontFamily }}>
        TreeView requires a hierarchy. Use the groupBy transform or build a HierarchyNode manually.
      </div>
    );
  }

  return (
    <div
      role="tree"
      style={{
        height,
        overflow: 'auto',
        padding: theme.spacing.sm,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <TreeNodeRow node={data.hierarchy} depth={0} onSelect={onSelect} />
    </div>
  );
}
