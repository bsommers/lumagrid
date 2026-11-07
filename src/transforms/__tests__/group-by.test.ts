import { describe, it, expect } from 'vitest';
import { groupBy } from '../group-by.js';
import type { ChainableTransform, TransformedData } from '../types.js';
import type { GroupByOptions } from '../group-by.js';

// groupBy is exported as a factory; its declared type is a union with
// ChainableTransform, so narrow it to the callable form for tests.
const makeGroupBy = groupBy as (field: string, valueField?: string) => ChainableTransform<GroupByOptions>;

const data: TransformedData = {
  rows: [
    { team: 'red', score: 3, name: 'a' },
    { team: 'blue', score: 4, name: 'b' },
    { team: 'red', score: 'x', name: 'c' },
    { team: null, score: 1, name: 'd' },
    { team: 'red', score: 2, name: 'e' },
  ],
  fields: [],
  meta: { keep: true },
};

describe('groupBy', () => {
  it('counts rows per group, bucketing missing keys as "(blank)", in first-seen order', () => {
    const out = makeGroupBy('team').transform(data);
    expect(out.rows).toEqual([
      { team: 'red', count: 3 },
      { team: 'blue', count: 1 },
      { team: '(blank)', count: 1 },
    ]);
    expect(out.fields).toEqual([
      { key: 'team', type: 'string' },
      { key: 'count', type: 'number' },
    ]);
    expect(out.meta).toEqual({ keep: true });
  });

  it('sums only numeric values of the value field', () => {
    const out = makeGroupBy('team', 'score').transform(data);
    expect(out.rows[0]).toEqual({ team: 'red', count: 3, score: 5 });
    expect(out.fields).toContainEqual({ key: 'score', type: 'number' });
  });

  it('builds a two-level hierarchy whose node values are counts without a value field', () => {
    const { hierarchy } = makeGroupBy('team').transform(data);
    expect(hierarchy?.id).toBe('root');
    expect(hierarchy?.label).toBe('team');
    expect(hierarchy?.children?.map((c) => [c.id, c.value])).toEqual([
      ['red', 3], ['blue', 1], ['(blank)', 1],
    ]);
    expect(hierarchy?.children?.[0]?.data).toEqual({ team: 'red', score: 3, name: 'a' });
  });

  it('uses summed values in the hierarchy when a value field is set', () => {
    const { hierarchy } = makeGroupBy('team', 'score').transform(data);
    expect(hierarchy?.children?.map((c) => c.value)).toEqual([5, 4, 1]);
  });

  it('lets transform options override the factory field, value field and root label', () => {
    const out = makeGroupBy('team').transform(data, { field: 'name', valueField: 'score', rootLabel: 'All' });
    expect(out.rows).toHaveLength(5);
    expect(out.rows[1]).toEqual({ name: 'b', count: 1, score: 4 });
    expect(out.hierarchy?.label).toBe('All');
  });

  it('produces an empty hierarchy for empty input', () => {
    const out = makeGroupBy('team').transform({ rows: [], fields: [] });
    expect(out.rows).toEqual([]);
    expect(out.hierarchy?.children).toEqual([]);
  });
});
