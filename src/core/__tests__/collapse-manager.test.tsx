import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { CollapseManager, useCollapse } from '../collapse-manager.js';
import type { CollapseState } from '../collapse-manager.js';

function setup(defaultExpanded?: string[]): { get: () => CollapseState } {
  let state!: CollapseState;
  function Probe(): null {
    state = useCollapse();
    return null;
  }
  render(
    <CollapseManager defaultExpanded={defaultExpanded}>
      <Probe />
    </CollapseManager>,
  );
  return { get: () => state };
}

describe('CollapseManager', () => {
  it('starts with defaultExpanded ids', () => {
    const s = setup(['a']);
    expect(s.get().isExpanded('a')).toBe(true);
    expect(s.get().isExpanded('b')).toBe(false);
  });

  it('toggle expands then collapses', () => {
    const s = setup();
    act(() => s.get().toggle('x'));
    expect(s.get().isExpanded('x')).toBe(true);
    act(() => s.get().toggle('x'));
    expect(s.get().isExpanded('x')).toBe(false);
  });

  it('expand / collapse / expandAll / collapseAll', () => {
    const s = setup(['a']);
    act(() => s.get().expand('b'));
    expect([...s.get().expandedIds].sort()).toEqual(['a', 'b']);
    act(() => s.get().collapse('a'));
    expect(s.get().isExpanded('a')).toBe(false);
    act(() => s.get().expandAll(['c', 'd']));
    expect([...s.get().expandedIds].sort()).toEqual(['b', 'c', 'd']);
    act(() => s.get().collapseAll());
    expect(s.get().expandedIds.size).toBe(0);
  });

  it('drillDown records path and expands; rollUp collapses last', () => {
    const s = setup();
    act(() => s.get().drillDown('a'));
    act(() => s.get().drillDown('b'));
    expect(s.get().drillPath).toEqual(['a', 'b']);
    expect(s.get().isExpanded('b')).toBe(true);
    act(() => s.get().rollUp());
    expect(s.get().drillPath).toEqual(['a']);
    expect(s.get().isExpanded('b')).toBe(false);
    expect(s.get().isExpanded('a')).toBe(true);
  });

  it('rollUp with empty path is a no-op', () => {
    const s = setup(['a']);
    act(() => s.get().rollUp());
    expect(s.get().drillPath).toEqual([]);
    expect(s.get().isExpanded('a')).toBe(true);
  });

  it('useCollapse throws outside a provider', () => {
    function Bad(): null {
      useCollapse();
      return null;
    }
    const spy = console.error;
    console.error = () => {};
    try {
      expect(() => render(<Bad />)).toThrow(/CollapseManager/);
    } finally {
      console.error = spy;
    }
  });
});
