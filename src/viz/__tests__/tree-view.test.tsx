import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TreeView } from '../tree-view.js';
import { CollapseManager } from '../../core/collapse-manager.js';
import { lightTheme } from '../../theme/light.js';
import type { HierarchyNode, TransformedData } from '../../transforms/types.js';

const tree: HierarchyNode = {
  id: 'root', label: 'Root', value: 1234,
  children: [
    { id: 'a', label: 'Alpha', children: [{ id: 'a1', label: 'Deep' }] },
    { id: 'b', label: 'Beta' },
  ],
};
const withTree = (h?: HierarchyNode): TransformedData => ({
  rows: [], fields: [], ...(h ? { hierarchy: h } : {}),
});
const draw = (data: TransformedData, expanded: string[] = [], onSelect?: (n: HierarchyNode) => void) =>
  render(
    <CollapseManager defaultExpanded={expanded}>
      <TreeView data={data} width={300} height={200} theme={lightTheme}
        {...(onSelect ? { onSelect } : {})} />
    </CollapseManager>,
  );

describe('TreeView', () => {
  it('shows a message when there is no hierarchy', () => {
    const { container } = draw(withTree());
    expect(container.textContent).toContain('requires a hierarchy');
    expect(container.querySelector('[role="tree"]')).toBeNull();
  });

  it('renders only the root while collapsed', () => {
    const { container } = draw(withTree(tree));
    expect(container.querySelector('[role="tree"]')).not.toBeNull();
    expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(1);
    expect(container.textContent).toContain('1,234');
  });

  it('expands and collapses on click and sets aria-expanded', () => {
    const { container } = draw(withTree(tree));
    const root = container.querySelector('[role="treeitem"]')!;
    expect(root.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(root);
    expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(3);
    expect(container.querySelector('[role="treeitem"]')!.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(container.querySelector('[role="treeitem"]')!);
    expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(1);
  });

  it('honours defaultExpanded for nested nodes', () => {
    const { container } = draw(withTree(tree), ['root', 'a']);
    expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(4);
    expect(container.textContent).toContain('Deep');
  });

  it('leaf nodes have no aria-expanded and still fire onSelect', () => {
    const onSelect = vi.fn();
    const { container } = draw(withTree(tree), ['root'], onSelect);
    const items = container.querySelectorAll('[role="treeitem"]');
    const beta = items[items.length - 1]!;
    expect(beta.getAttribute('aria-expanded')).toBeNull();
    fireEvent.click(beta);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  it('handles a single leaf root and an empty children array', () => {
    const { container } = draw(withTree({ id: 'x', label: 'Solo', children: [] }));
    const item = container.querySelector('[role="treeitem"]')!;
    expect(item.getAttribute('aria-expanded')).toBeNull();
    expect(item.textContent).toContain('Solo');
  });

  it('renders a value of 0', () => {
    const { container } = draw(withTree({ id: 'x', label: 'Z', value: 0 }));
    expect(container.textContent).toContain('0');
  });
});
