import { describe, it, expect } from 'vitest';
import { graphThemeAdapter } from '../graph-theme.js';
import { lightTheme } from '../../theme/light.js';
import { darkTheme } from '../../theme/dark.js';

describe('graphThemeAdapter', () => {
  it('derives tokens from the theme', () => {
    const t = graphThemeAdapter(lightTheme);
    expect(t.background).toBe(lightTheme.surface.background);
    expect(t.nodeColors).toEqual(lightTheme.colors.categorical);
    expect(Number.isFinite(t.fontSize)).toBe(true);
  });
  it('differs between light and dark', () => {
    expect(graphThemeAdapter(lightTheme)).not.toEqual(graphThemeAdapter(darkTheme));
  });
});
