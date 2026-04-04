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
});
