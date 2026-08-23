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

  it('computes min and max', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'min' },
    });
    expect(result.rows.find((r) => r['region'] === 'East')?.['sales']).toBe(100);

    const maxResult = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'max' },
    });
    expect(maxResult.rows.find((r) => r['region'] === 'East')?.['sales']).toBe(200);
  });

  it('computes first and last, respecting row order within a group', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'first' },
    });
    expect(result.rows.find((r) => r['region'] === 'East')?.['sales']).toBe(100);

    const lastResult = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'last' },
    });
    expect(lastResult.rows.find((r) => r['region'] === 'East')?.['sales']).toBe(200);
  });

  it('groups by multiple keys at once', () => {
    const data: TransformedData = {
      rows: [
        { region: 'East', category: 'A', sales: 100 },
        { region: 'East', category: 'A', sales: 50 },
        { region: 'East', category: 'B', sales: 20 },
        { region: 'West', category: 'A', sales: 10 },
      ],
      fields: [
        { key: 'region', type: 'string' },
        { key: 'category', type: 'string' },
        { key: 'sales', type: 'number' },
      ],
    };
    const result = aggregate.transform(data, {
      groupBy: ['region', 'category'],
      aggregations: { sales: 'sum' },
    });
    expect(result.rows).toHaveLength(3);
    const eastA = result.rows.find((r) => r['region'] === 'East' && r['category'] === 'A');
    const eastB = result.rows.find((r) => r['region'] === 'East' && r['category'] === 'B');
    const westA = result.rows.find((r) => r['region'] === 'West' && r['category'] === 'A');
    expect(eastA?.['sales']).toBe(150);
    expect(eastB?.['sales']).toBe(20);
    expect(westA?.['sales']).toBe(10);
  });

  it('applies multiple aggregations in the same call', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'sum', returns: 'avg' },
    });
    const east = result.rows.find((r) => r['region'] === 'East');
    expect(east?.['sales']).toBe(300);
    expect(east?.['returns']).toBe(7.5);
  });

  it('silently aggregates to 0 when a group has no numeric values for the field', () => {
    const data: TransformedData = {
      rows: [
        { region: 'East', sales: 100 },
        { region: 'West', note: 'no sales data for this row' },
      ],
      fields: [
        { key: 'region', type: 'string' },
        { key: 'sales', type: 'number' },
      ],
    };
    const result = aggregate.transform(data, {
      groupBy: ['region'],
      aggregations: { sales: 'sum' },
    });
    expect(result.rows.find((r) => r['region'] === 'West')?.['sales']).toBe(0);
  });
});
