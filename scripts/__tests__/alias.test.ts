import { describe, expect, it } from 'vitest';

// Gate for every guide and site test that imports by package name: vitest must
// resolve lumagrid and its four subpaths to src.
describe('lumagrid vitest alias', () => {
  it('resolves lumagrid', async () => {
    const m = await import('lumagrid');
    expect(typeof m.registerPlugin).toBe('function');
  });
  it('resolves lumagrid/transforms', async () => {
    const m = await import('lumagrid/transforms');
    expect(m.flatten).toBeDefined();
  });
  it('resolves lumagrid/theme', async () => {
    const m = await import('lumagrid/theme');
    expect(m.lightTheme).toBeDefined();
  });
  it('resolves lumagrid/viz', async () => {
    const m = await import('lumagrid/viz');
    expect(m.HorizontalBarChart).toBeDefined();
  });
  it('resolves lumagrid/plugins', async () => {
    const m = await import('lumagrid/plugins');
    expect(typeof m.createD3Plugin).toBe('function');
  });
});
