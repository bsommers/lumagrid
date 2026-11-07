import { describe, it, expect } from 'vitest';
import { pivot } from '../pivot.js';
import type { TransformedData } from '../types.js';

const tall: TransformedData = {
  rows: [
    { region: 'East', quarter: 'Q2', sales: 20 },
    { region: 'East', quarter: 'Q1', sales: 10 },
    { region: 'West', quarter: 'Q1', sales: 5 },
    { region: 'East', quarter: 'Q1', sales: 7 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'quarter', type: 'string' },
    { key: 'sales', type: 'number' },
  ],
  meta: { source: 'test' },
};

const opts = { columnField: 'quarter', valueField: 'sales', rowFields: ['region'] };

describe('pivot', () => {
  it('returns the input unchanged when no options are given', () => {
    expect(pivot.transform(tall)).toBe(tall);
  });

  it('spreads column values into sorted wide columns, keeping first value by default', () => {
    const out = pivot.transform(tall, opts);
    expect(out.rows).toEqual([
      { region: 'East', Q1: 10, Q2: 20 },
      { region: 'West', Q1: 5, Q2: null },
    ]);
    expect(out.fields).toEqual([
      { key: 'region', type: 'string' },
      { key: 'Q1', type: 'number' },
      { key: 'Q2', type: 'number' },
    ]);
    expect(out.meta).toEqual({ source: 'test' });
  });

  it('sums duplicate cells with aggregation "sum"', () => {
    const out = pivot.transform(tall, { ...opts, aggregation: 'sum' });
    expect(out.rows[0]).toEqual({ region: 'East', Q1: 17, Q2: 20 });
  });

  it('keeps the last duplicate with aggregation "last"', () => {
    const out = pivot.transform(tall, { ...opts, aggregation: 'last' });
    expect(out.rows[0]).toEqual({ region: 'East', Q1: 7, Q2: 20 });
  });

  it('parses numeric strings and treats non-numeric or missing values as 0', () => {
    const data: TransformedData = {
      rows: [
        { id: 'a', col: 'x', v: '3.5' },
        { id: 'b', col: 'x', v: 'n/a' },
        { id: 'c', col: 'x', v: null },
      ],
      fields: [],
    };
    const out = pivot.transform(data, { columnField: 'col', valueField: 'v', rowFields: ['id'] });
    expect(out.rows.map((r) => r['x'])).toEqual([3.5, 0, 0]);
  });

  it('groups on composite row keys and fills missing row/column fields with null/empty', () => {
    const data: TransformedData = {
      rows: [
        { a: 'x', b: 'y', col: 'c1', v: 1 },
        { a: 'x', b: 'z', col: 'c1', v: 2 },
        { a: 'x', col: null, v: 3 },
      ],
      fields: [],
    };
    const out = pivot.transform(data, { columnField: 'col', valueField: 'v', rowFields: ['a', 'b'] });
    expect(out.rows).toEqual([
      { a: 'x', b: 'y', '': null, c1: 1 },
      { a: 'x', b: 'z', '': null, c1: 2 },
      { a: 'x', b: null, '': 3, c1: null },
    ]);
  });
});
