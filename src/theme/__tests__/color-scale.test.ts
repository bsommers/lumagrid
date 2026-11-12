import { describe, it, expect } from 'vitest';
import { categoricalColor, sequentialColor, divergingColor, thresholdScale } from '../color-scale.js';
import type { ThemeDefinition } from '../types.js';

function themeWith(colors: Partial<ThemeDefinition['colors']>): ThemeDefinition {
  return { colors: { categorical: [], sequential: [], diverging: [], ...colors } } as unknown as ThemeDefinition;
}

describe('color-scale', () => {
  it('categoricalColor wraps and falls back on empty palette', () => {
    const t = themeWith({ categorical: ['#111111', '#222222'] });
    expect(categoricalColor(t, 0)).toBe('#111111');
    expect(categoricalColor(t, 3)).toBe('#222222');
    expect(categoricalColor(themeWith({ categorical: [] }), 0)).toBe('#4e79a7');
  });

  it('sequentialColor interpolates and clamps', () => {
    const t = themeWith({ sequential: ['#000000', '#ffffff'] });
    expect(sequentialColor(t, 0)).toBe('rgb(0,0,0)');
    expect(sequentialColor(t, 0.5)).toBe('rgb(128,128,128)');
    expect(sequentialColor(t, 5)).toBe('rgb(255,255,255)');
    expect(sequentialColor(t, -5)).toBe('rgb(0,0,0)');
  });

  it('handles empty, single and 3-digit hex palettes', () => {
    expect(sequentialColor(themeWith({ sequential: [] }), 0.5)).toBe('#000000');
    expect(sequentialColor(themeWith({ sequential: ['#abcdef'] }), 0.5)).toBe('#abcdef');
    const t = themeWith({ sequential: ['#000', '#fff'] });
    expect(sequentialColor(t, 1)).toBe('rgb(255,255,255)');
  });

  it('divergingColor maps -1/0/1 to ends and midpoint', () => {
    const t = themeWith({ diverging: ['#ff0000', '#ffffff', '#0000ff'] });
    expect(divergingColor(t, -1)).toBe('rgb(255,0,0)');
    expect(divergingColor(t, 0)).toBe('rgb(255,255,255)');
    expect(divergingColor(t, 1)).toBe('rgb(0,0,255)');
    expect(divergingColor(t, 9)).toBe('rgb(0,0,255)');
  });

  it('thresholdScale buckets values and validates lengths', () => {
    const f = thresholdScale([10, 20], ['a', 'b', 'c']);
    expect(f(5)).toBe('a');
    expect(f(10)).toBe('b');
    expect(f(25)).toBe('c');
    expect(() => thresholdScale([1], ['a'])).toThrow(/one more/);
  });
});
