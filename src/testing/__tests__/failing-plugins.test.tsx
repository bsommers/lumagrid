import React, { useId } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertPluginConformance, checkPluginConformance, emptyData, sampleData } from '../index.js';
import type { ChartPlugin } from '../../registry/types.js';
import type { TransformedData } from '../../transforms/types.js';

beforeEach(() => {
  // React logs every error it catches; the failing plugins throw on purpose.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

type P = ChartPlugin<TransformedData, unknown, Record<string, unknown>>;

/** A plugin that passes every check; each test breaks exactly one thing. */
function good(over: Partial<P> = {}): P {
  return {
    id: 'good',
    label: 'Good',
    dataAdapter: (d) => d,
    themeAdapter: (t) => ({ bg: t.surface.background }),
    Renderer: ({ data, width, height }) => (
      <svg width={width} height={height} role="img" aria-label="Good chart">
        <text>{data.rows.length}</text>
      </svg>
    ),
    ...over,
  };
}

const statusOf = (plugin: unknown, id: string, opts = {}) =>
  checkPluginConformance(plugin as P, opts).checks.find((c) => c.id === id)!;

describe('conformance kit: the baseline passes', () => {
  it('reports all eight checks as passing', () => {
    const report = checkPluginConformance(good());
    expect(report.ok).toBe(true);
    expect(report.checks.map((c) => c.id)).toEqual([
      'shape', 'renders-sample', 'renders-empty', 'respects-size',
      'accessible-name', 'deterministic', 'no-mutation', 'theme-switch',
    ]);
    expect(report.checks.every((c) => c.status === 'pass')).toBe(true);
    expect(assertPluginConformance(good()).ok).toBe(true);
  });

  it('works in server mode and with a wrapper and custom data', () => {
    const Wrapper = ({ children }: { children?: React.ReactNode }) => <section>{children}</section>;
    const report = checkPluginConformance(good(), { mode: 'server', wrapper: Wrapper, data: sampleData, config: { a: 1 }, width: 100, height: 80 });
    expect(report.ok).toBe(true);
  });
});

describe('conformance kit: each check can fail', () => {
  it('shape: bad id, label, adapters and Renderer', () => {
    const bad = { id: ' ', label: '', dataAdapter: 1, themeAdapter: null, Renderer: 'div' };
    const c = statusOf(bad, 'shape');
    expect(c.status).toBe('fail');
    expect(c.detail).toMatch(/id must be/);
    expect(c.detail).toMatch(/label/);
    expect(c.detail).toMatch(/dataAdapter/);
    expect(c.detail).toMatch(/themeAdapter/);
    expect(c.detail).toMatch(/Renderer/);
    expect(statusOf({ ...good(), id: 5 }, 'shape').status).toBe('fail');
    expect(statusOf({ ...good(), label: 3 }, 'shape').status).toBe('fail');
  });

  it('shape: a non-object plugin fails and the other checks are skipped', () => {
    const report = checkPluginConformance(null as never);
    expect(report.ok).toBe(false);
    expect(report.checks[0]?.detail).toBe('plugin is not an object');
    expect(report.checks.slice(1).every((c) => c.status === 'skip')).toBe(true);
  });

  it('shape: accepts memo/forwardRef style renderers', () => {
    const Renderer = React.memo(good().Renderer);
    expect(statusOf(good({ Renderer: Renderer as P['Renderer'] }), 'shape').status).toBe('pass');
  });

  it('renders-sample: throws on sample data', () => {
    const plugin = good({ Renderer: () => { throw new Error('boom'); } });
    const c = statusOf(plugin, 'renders-sample');
    expect(c.status).toBe('fail');
    expect(c.detail).toContain('boom');
  });

  it('renders-sample: a non-Error throw is reported', () => {
    const plugin = good({ Renderer: () => { throw 'plain string'; } });
    expect(statusOf(plugin, 'renders-sample').detail).toContain('plain string');
  });

  it('renders-empty: only breaks on zero rows', () => {
    const plugin = good({
      Renderer: ({ data, width, height }) => {
        if (data.rows.length === 0) throw new Error('no rows');
        return <svg width={width} height={height} aria-label="x" />;
      },
    });
    expect(statusOf(plugin, 'renders-sample').status).toBe('pass');
    const c = statusOf(plugin, 'renders-empty');
    expect(c.status).toBe('fail');
    expect(c.detail).toContain('no rows');
    expect(emptyData.rows).toHaveLength(0);
  });

  it('respects-size: ignores width and height', () => {
    const plugin = good({ Renderer: () => <div aria-label="fixed">fixed</div> });
    expect(statusOf(plugin, 'respects-size').status).toBe('fail');
  });

  it('respects-size: throws', () => {
    const plugin = good({ Renderer: () => { throw new Error('nope'); } });
    expect(statusOf(plugin, 'respects-size').detail).toContain('nope');
  });

  it('accessible-name: markup without a name', () => {
    const plugin = good({ Renderer: ({ width }) => <svg width={width}><rect /></svg> });
    const c = statusOf(plugin, 'accessible-name');
    expect(c.status).toBe('fail');
    expect(c.detail).toMatch(/no accessible name/);
  });

  it('accessible-name: empty aria-label does not count, <title> and title do', () => {
    const empty = good({ Renderer: ({ width }) => <svg width={width} aria-label=" " /> });
    expect(statusOf(empty, 'accessible-name').status).toBe('fail');
    const titled = good({ Renderer: ({ width }) => <svg width={width}><title>Sales</title></svg> });
    expect(statusOf(titled, 'accessible-name').status).toBe('pass');
    const attr = good({ Renderer: ({ width }) => <div style={{ width }} title="Sales" /> });
    expect(statusOf(attr, 'accessible-name').status).toBe('pass');
    const labelled = good({ Renderer: ({ width }) => <div style={{ width }} aria-labelledby="h" /> });
    expect(statusOf(labelled, 'accessible-name').status).toBe('pass');
  });

  it('accessible-name: throws', () => {
    const plugin = good({ Renderer: () => { throw new Error('x'); } });
    expect(statusOf(plugin, 'accessible-name').status).toBe('fail');
  });

  it('deterministic: random output', () => {
    const plugin = good({
      Renderer: ({ width }) => <svg width={width} aria-label={`chart ${Math.random()}`} />,
    });
    expect(statusOf(plugin, 'deterministic').status).toBe('fail');
  });

  it('deterministic: useId is normalized, so it does not fail', () => {
    const Renderer: P['Renderer'] = ({ width }) => {
      const id = useId();
      return <svg width={width} aria-labelledby={id}><title id={id}>t</title></svg>;
    };
    expect(statusOf(good({ Renderer }), 'deterministic').status).toBe('pass');
  });

  it('deterministic: throws', () => {
    const plugin = good({ Renderer: () => { throw new Error('x'); } });
    expect(statusOf(plugin, 'deterministic').status).toBe('fail');
  });

  it('no-mutation: dataAdapter sorts the rows in place', () => {
    const plugin = good({ dataAdapter: (d) => { d.rows.sort((a, b) => String(a['region']).localeCompare(String(b['region']))); return d; } });
    const c = statusOf(plugin, 'no-mutation');
    expect(c.status).toBe('fail');
    expect(c.detail).toMatch(/mutates its input/);
  });

  it('no-mutation: detects a change in the JSON snapshot', () => {
    const plugin = good({
      Renderer: ({ data, width }) => {
        Object.defineProperty(data, 'toJSON', { value: () => ({ changed: true }), configurable: true });
        return <svg width={width} aria-label="x" />;
      },
    });
    // The frozen object refuses the defineProperty, which is reported as a failure on frozen input.
    expect(statusOf(plugin, 'no-mutation').status).toBe('fail');
  });

  it('theme-switch: ignores the theme', () => {
    const plugin = good({ themeAdapter: () => ({ fixed: true }) });
    const c = statusOf(plugin, 'theme-switch');
    expect(c.status).toBe('fail');
    expect(c.detail).toMatch(/ignores the theme/);
  });

  it('theme-switch: throws on one theme', () => {
    const plugin = good({ themeAdapter: (t) => { if (t.name === 'dark') throw new Error('dark unsupported'); return {}; } });
    const c = statusOf(plugin, 'theme-switch');
    expect(c.status).toBe('fail');
    expect(c.detail).toContain('dark unsupported');
  });

  it('theme-switch: markup alone can show the theme is used', () => {
    const plugin = good({
      themeAdapter: () => ({}),
      dataAdapter: (d) => d,
      Renderer: ({ width, theme }) => <svg width={width} aria-label="x" data-t={JSON.stringify(theme)} />,
    });
    // adapted theme is identical, markup is identical too: fails.
    expect(statusOf(plugin, 'theme-switch').status).toBe('fail');
  });
});

describe('conformance kit: skip option and assert', () => {
  it('records skips with their reason and does not fail', () => {
    const plugin = good({ Renderer: () => <div>fixed</div> });
    const report = checkPluginConformance(plugin, { skip: { 'respects-size': 'fixed size by design', 'accessible-name': 'decorative' } });
    expect(report.checks.find((c) => c.id === 'respects-size')).toMatchObject({ status: 'skip', detail: 'skipped: fixed size by design' });
    expect(report.ok).toBe(true);
  });

  it('assertPluginConformance throws a readable message', () => {
    const plugin = good({ id: 'broken', Renderer: () => { throw new Error('kaboom'); } });
    expect(() => assertPluginConformance(plugin)).toThrowError(/Plugin "broken" failed \d+ conformance check\(s\):[\s\S]*renders-sample[\s\S]*kaboom/);
  });

  it('assertPluginConformance copes with a missing plugin', () => {
    expect(() => assertPluginConformance(null as never)).toThrowError(/Plugin "undefined" failed/);
  });
});
