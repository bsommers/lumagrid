import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRechartsPlugin, rechartsThemeAdapter } from '../recharts-adapter.js';
import type { ThemeDefinition } from '../../theme/types.js';
import type { TransformedData } from '../../transforms/types.js';

const fakeTheme: ThemeDefinition = {
  name: 'fake',
  colors: {
    categorical: ['#111111', '#222222'],
    sequential: ['#333333'],
    diverging: ['#444444'],
  },
  typography: {
    fontFamily: 'Fake Sans',
    fontSizeBase: '14px',
    fontSizeSm: '11px',
    fontSizeLg: '16px',
    fontWeightNormal: 400,
    fontWeightBold: 700,
    lineHeight: 1.4,
  },
  spacing: { base: 8, xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  surface: {
    background: '#aaaaaa',
    surface: '#bbbbbb',
    border: '#cccccc',
    borderRadius: '4px',
    shadowSm: 'none',
    shadowMd: 'none',
  },
  text: {
    primary: '#000001',
    secondary: '#000002',
    disabled: '#000003',
    inverse: '#ffffff',
  },
};

const withBothFields: TransformedData = {
  rows: [{ region: 'East', sales: 100 }],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'sales', type: 'number' },
  ],
};

const numbersOnly: TransformedData = {
  rows: [{ sales: 100, returns: 5 }],
  fields: [
    { key: 'sales', type: 'number' },
    { key: 'returns', type: 'number' },
  ],
};

const stringsOnly: TransformedData = {
  rows: [{ region: 'East', city: 'NYC' }],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'city', type: 'string' },
  ],
};

function plugin() {
  return createRechartsPlugin({ id: 'rc-test', Renderer: () => null });
}

describe('recharts-adapter defaultDataAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('auto-detects nameKey/dataKey and does not warn when both field types are present', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = plugin().dataAdapter(withBothFields);
    expect(rows).toEqual([{ region: 'East', sales: 100, name: 'East', value: 100 }]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns and falls back to an empty name when no string field exists', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = plugin().dataAdapter(numbersOnly);
    expect(rows[0]?.name).toBe('');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/nameKey/);
  });

  it('warns and falls back to a zero value when no number field exists', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = plugin().dataAdapter(stringsOnly);
    expect(rows[0]?.value).toBe(0);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/dataKey/);
  });

  it('does not warn when nameKey/dataKey are given explicitly, even if field types would not auto-detect', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = plugin().dataAdapter(numbersOnly, { nameKey: 'sales', dataKey: 'returns' });
    expect(rows[0]).toEqual({ sales: 100, returns: 5, name: '100', value: 5 });
    expect(warn).not.toHaveBeenCalled();
  });

  it('coerces boolean and null extra fields, and handles multiple rows', () => {
    const data: TransformedData = {
      rows: [
        { region: 'East', sales: 100, active: true, note: null },
        { region: 'West', sales: 200, active: false, note: null },
      ],
      fields: [
        { key: 'region', type: 'string' },
        { key: 'sales', type: 'number' },
      ],
    };
    const rows = plugin().dataAdapter(data);
    expect(rows).toEqual([
      { region: 'East', sales: 100, active: 'true', note: null, name: 'East', value: 100 },
      { region: 'West', sales: 200, active: 'false', note: null, name: 'West', value: 200 },
    ]);
  });
});

describe('rechartsThemeAdapter', () => {
  it('maps ThemeDefinition to RechartsTheme', () => {
    expect(rechartsThemeAdapter(fakeTheme)).toEqual({
      colors: ['#111111', '#222222'],
      fontFamily: 'Fake Sans',
      fontSize: '11px',
      gridColor: '#cccccc',
      textColor: '#000002',
      background: '#aaaaaa',
    });
  });
});

describe('createRechartsPlugin wiring', () => {
  it('defaults label to id', () => {
    const p = createRechartsPlugin({ id: 'rc-wiring-1', Renderer: () => null });
    expect(p.label).toBe('rc-wiring-1');
  });

  it('uses the provided label when given', () => {
    const p = createRechartsPlugin({ id: 'rc-wiring-2', label: 'My Chart', Renderer: () => null });
    expect(p.label).toBe('My Chart');
  });

  it('uses rechartsThemeAdapter as the themeAdapter', () => {
    const p = createRechartsPlugin({ id: 'rc-wiring-3', Renderer: () => null });
    expect(p.themeAdapter(fakeTheme)).toEqual(rechartsThemeAdapter(fakeTheme));
  });

  it('uses a custom dataAdapter instead of the default when provided', () => {
    const customDataAdapter = vi.fn(() => [{ name: 'custom', value: 1 }]);
    const p = createRechartsPlugin({ id: 'rc-wiring-4', Renderer: () => null, dataAdapter: customDataAdapter });
    const result = p.dataAdapter(withBothFields);
    expect(customDataAdapter).toHaveBeenCalledWith(withBothFields);
    expect(result).toEqual([{ name: 'custom', value: 1 }]);
  });

  it('passes the Renderer through unchanged', () => {
    const Renderer = () => null;
    const p = createRechartsPlugin({ id: 'rc-wiring-5', Renderer });
    expect(p.Renderer).toBe(Renderer);
  });
});
