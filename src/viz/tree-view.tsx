import React, { useRef, useState } from 'react';
import { useCollapse } from '../core/collapse-manager.js';
import type { NativeChartProps } from '../registry/native-plugin.js';
import type { ThemeDefinition } from '../theme/types.js';
import type { HierarchyNode } from '../transforms/types.js';

interface TreeNodeProps {
  node: HierarchyNode;
  depth: number;
  onSelect: ((node: HierarchyNode) => void) | undefined;
  theme: ThemeDefinition;
  focusId: string;
  selectedId: string | null;
  onFocusNode: (id: string) => void;
  onActivate: (node: HierarchyNode) => void;
  posInSet: number;
  setSize: number;
}

function TreeNodeRow({
  node, depth, onSelect, theme, focusId, selectedId, onFocusNode, onActivate, posInSet, setSize,
}: TreeNodeProps): React.ReactElement {
  const collapse = useCollapse();
  const hasChildren = node.children && node.children.length > 0;
  const expanded = collapse.isExpanded(node.id);

  const [focused, setFocused] = useState(false);
  const indent = depth * parseInt(theme.spacing.lg);

  return (
    <>
      <div
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        aria-selected={selectedId === node.id}
        aria-level={depth + 1}
        aria-posinset={posInSet}
        aria-setsize={setSize}
        data-node-id={node.id}
        tabIndex={focusId === node.id ? 0 : -1}
        onFocus={(e) => { if (e.target === e.currentTarget) { setFocused(true); onFocusNode(node.id); } }}
        onBlur={() => setFocused(false)}
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
          outline: focused ? `2px solid ${theme.colors.categorical[0] ?? 'currentColor'}` : 'none',
          outlineOffset: -2,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = theme.surface.surface; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        onClick={() => onActivate(node)}
      >
        <span style={{ width: 16, flexShrink: 0, color: theme.text.secondary, fontSize: 10 }}>
          <span aria-hidden="true">{hasChildren ? (expanded ? '▼' : '▶') : ''}</span>
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
      {hasChildren && expanded && node.children?.map((child, ci, arr) => (
        <TreeNodeRow key={child.id} node={child} depth={depth + 1} onSelect={onSelect} theme={theme}
          focusId={focusId} selectedId={selectedId} onFocusNode={onFocusNode} onActivate={onActivate}
          posInSet={ci + 1} setSize={arr.length} />
      ))}
    </>
  );
}

/**
 * Props for {@link TreeView}.
 *
 * @public
 */
export interface TreeViewProps extends NativeChartProps {
  /** Called with the node when a tree row is selected. */
  onSelect?: (node: HierarchyNode) => void;
}

/**
 * Collapsible tree of `data.hierarchy`. Ignores the field props. The tree is named by `ariaLabel`
 * (default `"Tree"`).
 *
 * @public
 */
export function TreeView({ data, height, theme, onSelect, ariaLabel }: TreeViewProps): React.ReactElement {
  const collapse = useCollapse();
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusIdState, setFocusId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!data.hierarchy) {
    return (
      <div style={{ padding: theme.spacing.md, color: theme.text.secondary, fontFamily: theme.typography.fontFamily }}>
        TreeView requires a hierarchy. Use the groupBy transform or build a HierarchyNode manually.
      </div>
    );
  }

  // Flat list of visible nodes with parent links, in display order.
  const visible: Array<{ node: HierarchyNode; parent: HierarchyNode | null }> = [];
  const walk = (n: HierarchyNode, parent: HierarchyNode | null) => {
    visible.push({ node: n, parent });
    if (n.children && n.children.length > 0 && collapse.isExpanded(n.id)) {
      n.children.forEach((c) => walk(c, n));
    }
  };
  walk(data.hierarchy, null);

  const focusId = focusIdState !== null && visible.some((v) => v.node.id === focusIdState)
    ? focusIdState
    : data.hierarchy.id;

  const moveTo = (id: string) => {
    setFocusId(id);
    const el = Array.from(containerRef.current?.querySelectorAll<HTMLElement>('[data-node-id]') ?? [])
      .find((e) => e.dataset['nodeId'] === id);
    el?.focus();
  };

  const activate = (node: HierarchyNode) => {
    if (node.children && node.children.length > 0) collapse.toggle(node.id);
    setSelectedId(node.id);
    onSelect?.(node);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = visible.findIndex((v) => v.node.id === focusId);
    const cur = visible[idx];
    if (!cur) return;
    const hasChildren = !!cur.node.children && cur.node.children.length > 0;
    const expanded = collapse.isExpanded(cur.node.id);
    switch (e.key) {
      case 'ArrowDown': { const n = visible[idx + 1]; if (n) moveTo(n.node.id); break; }
      case 'ArrowUp': { const n = visible[idx - 1]; if (n) moveTo(n.node.id); break; }
      case 'Home': moveTo(visible[0]!.node.id); break;
      case 'End': moveTo(visible[visible.length - 1]!.node.id); break;
      case 'ArrowRight':
        if (hasChildren && !expanded) collapse.toggle(cur.node.id);
        else if (hasChildren) moveTo(cur.node.children![0]!.id);
        break;
      case 'ArrowLeft':
        if (hasChildren && expanded) collapse.toggle(cur.node.id);
        else if (cur.parent) moveTo(cur.parent.id);
        break;
      case 'Enter':
      case ' ':
        activate(cur.node);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      role="tree"
      aria-label={ariaLabel ?? 'Tree'}
      onKeyDown={onKeyDown}
      style={{
        height,
        overflow: 'auto',
        padding: theme.spacing.sm,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <TreeNodeRow node={data.hierarchy} depth={0} onSelect={onSelect} theme={theme}
        focusId={focusId} selectedId={selectedId} onFocusNode={setFocusId} onActivate={activate}
        posInSet={1} setSize={1} />
    </div>
  );
}
