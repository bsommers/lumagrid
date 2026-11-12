import { describe, it, expect } from 'vitest';
import { aggregate } from '../aggregate.js';
import type { TransformedData } from '../types.js';

const data: TransformedData = {
  rows: [
    { g: 'a', v: 4 },
    { g: 'a', v: 2 },
    { g: 'b', v: 'x' },
    { g: null, v: 7 },
  ],
  fields: [{ key: 'g', type: 'string' }, { key: 'v', type: 'number' }],
};
const run = (fn: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last') =>
  aggregate.transform(data, { groupBy: ['g'], aggregations: { v: fn } }).rows;

describe('aggregate edge cases', () => {
  it('returns input unchanged without options', () => {
    expect(aggregate.transform(data)).toBe(data);
  });

  it('computes min/max/first/last/avg', () => {
    expect(run('min')[0]).toEqual({ g: 'a', v: 2 });
    expect(run('max')[0]).toEqual({ g: 'a', v: 4 });
    expect(run('first')[0]).toEqual({ g: 'a', v: 4 });
    expect(run('last')[0]).toEqual({ g: 'a', v: 2 });
    expect(run('avg')[0]).toEqual({ g: 'a', v: 3 });
  });

  it('yields 0 for groups with no numeric values and counts all rows', () => {
    expect(run('sum')[1]).toEqual({ g: 'b', v: 0 });
    expect(run('count')[0]).toEqual({ g: 'a', v: 2 });
  });

  it('treats null/missing group values as null-keyed group', () => {
    expect(run('sum')[2]).toEqual({ g: null, v: 7 });
  });
});
