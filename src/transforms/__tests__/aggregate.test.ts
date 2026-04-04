import { describe, it, expect } from 'vitest';
import { aggregate } from '../aggregate.js';
import type { TransformedData } from '../types.js';

const base: TransformedData = {
  rows: [
    { region: 'East', sales: 100, returns: 5 },
    { region: 'East', sales: 200, returns: 10 },
    { region: 'West', sales: 150, returns: 3 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'sales', type: 'number' },
    { key: 'returns', type: 'number' },
  ],
};

describe('aggregate', () => {
  it('groups rows and sums a field', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'sum' },
    });
    const east = result.rows.find((r) => r['region'] === 'East');
    expect(east?.['sales']).toBe(300);
  });

  it('counts rows per group', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'count' },
    });
    const east = result.rows.find((r) => r['region'] === 'East');
    expect(east?.['sales']).toBe(2);
  });

  it('computes average', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'avg' },
    });
    const east = result.rows.find((r) => r['region'] === 'East');
    expect(east?.['sales']).toBe(150);
  });

  it('returns original data when no options provided', () => {
    const result = aggregate.transform(base, undefined);
    expect(result).toBe(base);
  });
});
