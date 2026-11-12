import { describe, it, expect } from 'vitest';
import { niceTicks } from '../ticks.js';

describe('niceTicks', () => {
  it('covers the range with 1/2/5 steps', () => {
    expect(niceTicks(0, 44.4)).toEqual([0, 20, 40, 60]);
    expect(niceTicks(0, 16.2)).toEqual([0, 5, 10, 15, 20]);
    expect(niceTicks(0, 1)).toEqual([0, 0.5, 1]);
  });

  it('handles negative and degenerate ranges without NaN', () => {
    const neg = niceTicks(-7, 3);
    expect(neg[0]).toBeLessThanOrEqual(-7);
    expect(neg[neg.length - 1]).toBeGreaterThanOrEqual(3);
    expect(niceTicks(5, 5).every(Number.isFinite)).toBe(true);
  });
});
