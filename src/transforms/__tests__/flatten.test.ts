import { describe, it, expect } from 'vitest';
import { flatten } from '../flatten.js';

describe('flatten', () => {
  it('flattens a nested object', () => {
    const result = flatten.transform([{ a: { b: 1, c: { d: 2 } } }]);
    expect(result.rows).toEqual([{ 'a.b': 1, 'a.c.d': 2 }]);
  });

  it('uses a custom separator', () => {
    const result = flatten.transform([{ a: { b: 1 } }], { separator: '_' });
    expect(result.rows[0]).toHaveProperty('a_b', 1);
  });

  it('handles null values', () => {
    const result = flatten.transform([{ a: null }]);
    expect(result.rows[0]).toHaveProperty('a', null);
  });

  it('handles flat objects without nesting', () => {
    const result = flatten.transform([{ x: 1, y: 'hello' }]);
    expect(result.rows[0]).toEqual({ x: 1, y: 'hello' });
  });

  it('returns empty rows for empty input', () => {
    const result = flatten.transform([]);
    expect(result.rows).toHaveLength(0);
    expect(result.fields).toHaveLength(0);
  });

  it('infers field types correctly', () => {
    const result = flatten.transform([{ count: 5, name: 'foo', active: true }]);
    const types = Object.fromEntries(result.fields.map((f) => [f.key, f.type]));
    expect(types['count']).toBe('number');
    expect(types['name']).toBe('string');
    expect(types['active']).toBe('boolean');
  });

  it('converts Date values to ISO strings instead of dropping them', () => {
    const date = new Date('2024-03-15T10:30:00.000Z');
    const result = flatten.transform([{ createdAt: date, name: 'x' }]);
    expect(result.rows[0]).toEqual({ createdAt: '2024-03-15T10:30:00.000Z', name: 'x' });
  });

  it('stringifies array values via String()', () => {
    const result = flatten.transform([{ tags: [1, 2, 3] }]);
    expect(result.rows[0]).toEqual({ tags: '1,2,3' });
  });

  it('stringifies undefined values', () => {
    const result = flatten.transform([{ a: undefined }]);
    expect(result.rows[0]).toEqual({ a: 'undefined' });
  });

  it('infers date type for real date strings', () => {
    const result = flatten.transform([{ createdAt: '2024-03-15T10:30:00.000Z' }]);
    const types = Object.fromEntries(result.fields.map((f) => [f.key, f.type]));
    expect(types['createdAt']).toBe('date');
  });

  it('does not misclassify year-like numeric strings as dates', () => {
    const result = flatten.transform([{ year: '2020' }, { year: '1999' }]);
    const types = Object.fromEntries(result.fields.map((f) => [f.key, f.type]));
    expect(types['year']).toBe('string');
  });
});
