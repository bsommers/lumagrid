import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRechartsPlugin } from '../recharts-adapter.js';
import type { TransformedData } from '../../transforms/types.js';

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
});
