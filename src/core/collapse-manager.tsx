import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

/**
 * Expand, collapse and drill-down state provided by {@link CollapseManager}.
 *
 * @public
 */
export interface CollapseState {
  /** Set of node IDs that are currently expanded. All others are collapsed. */
  expandedIds: ReadonlySet<string>;
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  expand: (id: string) => void;
  collapse: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
  /**
   * Drill down: expand the node and record it as the current drill-down path.
   * The path is used by rollUp to navigate back.
   */
  drillDown: (id: string) => void;
  /** Roll up: collapse the most recently drilled-into node. */
  rollUp: () => void;
  /** The current drill-down path (ordered list of IDs). */
  drillPath: readonly string[];
}

const CollapseContext = createContext<CollapseState | null>(null);

/**
 * Props for {@link CollapseManager}.
 *
 * @public
 */
export interface CollapseManagerProps {
  /** IDs that start expanded. Default: all collapsed. */
  defaultExpanded?: string[];
  children: React.ReactNode;
}

/**
 * Context provider that tracks which nodes are expanded and the drill-down path.
 *
 * @public
 */
export function CollapseManager({ defaultExpanded = [], children }: CollapseManagerProps): React.ReactElement {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(defaultExpanded));
  const drillPathRef = useRef<string[]>([]);
  const [drillPath, setDrillPath] = useState<string[]>([]);

  const isExpanded = useCallback((id: string) => expandedIds.has(id), [expandedIds]);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expand = useCallback((id: string) => {
    setExpandedIds((prev) => new Set(prev).add(id));
  }, []);

  const collapse = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const expandAll = useCallback((ids: string[]) => {
    setExpandedIds((prev) => new Set([...prev, ...ids]));
  }, []);

  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  const drillDown = useCallback((id: string) => {
    expand(id);
    drillPathRef.current = [...drillPathRef.current, id];
    setDrillPath([...drillPathRef.current]);
  }, [expand]);

  const rollUp = useCallback(() => {
    const path = drillPathRef.current;
    if (path.length === 0) return;
    const last = path[path.length - 1];
    if (last !== undefined) collapse(last);
    drillPathRef.current = path.slice(0, -1);
    setDrillPath([...drillPathRef.current]);
  }, [collapse]);

  const value: CollapseState = {
    expandedIds,
    isExpanded,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    drillDown,
    rollUp,
    drillPath,
  };

  return (
    <CollapseContext.Provider value={value}>
      {children}
    </CollapseContext.Provider>
  );
}

/**
 * Returns the collapse state from the nearest CollapseManager.
 *
 * @public
 */
export function useCollapse(): CollapseState {
  const ctx = useContext(CollapseContext);
  if (!ctx) throw new Error('useCollapse must be used inside a CollapseManager');
  return ctx;
}
