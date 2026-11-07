import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerPlugin, getPlugin, listPlugins, registerAndGetId, __resetRegistryForTests,
} from '../index.js';
import type { ChartPlugin } from '../types.js';

function fakePlugin(id: string): ChartPlugin<{ n: number }, { c: string }> {
  return {
    id,
    dataAdapter: () => ({ n: 1 }),
    themeAdapter: () => ({ c: 'red' }),
    Renderer: () => null,
  };
}

describe('registry', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetRegistryForTests();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('clears all registered plugins on reset', () => {
    registerPlugin(fakePlugin('registry-test-reset'));
    expect(getPlugin('registry-test-reset')).toBeDefined();

    __resetRegistryForTests();

    expect(getPlugin('registry-test-reset')).toBeUndefined();
    expect(listPlugins()).toEqual([]);
  });

  it('returns undefined for an id that was never registered', () => {
    expect(getPlugin('never-registered-plugin')).toBeUndefined();
  });

  it('makes a registered plugin retrievable by id', () => {
    const plugin = fakePlugin('registry-test-a');
    registerPlugin(plugin);
    expect(getPlugin('registry-test-a')).toBe(plugin);
  });

  it('overwrites a previous registration with the same id', () => {
    const first = fakePlugin('registry-test-b');
    const second = fakePlugin('registry-test-b');
    registerPlugin(first);
    registerPlugin(second);
    expect(getPlugin('registry-test-b')).toBe(second);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('does not warn on the first registration of an id', () => {
    registerPlugin(fakePlugin('registry-test-first'));
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once with the id on a duplicate registration and keeps the newer plugin', () => {
    registerPlugin(fakePlugin('registry-test-dup'));
    const newer = fakePlugin('registry-test-dup');
    registerPlugin(newer);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('registry-test-dup');
    expect(getPlugin('registry-test-dup')).toBe(newer);
  });

  it('stays silent but still overwrites in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const second = fakePlugin('registry-test-prod');
    registerPlugin(fakePlugin('registry-test-prod'));
    registerPlugin(second);
    expect(warn).not.toHaveBeenCalled();
    expect(getPlugin('registry-test-prod')).toBe(second);
  });

  it('neither throws nor warns when process is undefined, and still overwrites', () => {
    const second = fakePlugin('registry-test-noproc');
    registerPlugin(fakePlugin('registry-test-noproc'));
    try {
      vi.stubGlobal('process', undefined);
      expect(() => registerPlugin(second)).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
    expect(warn).not.toHaveBeenCalled();
    expect(getPlugin('registry-test-noproc')).toBe(second);
  });

  it('registerPlugin returns the plugin id', () => {
    expect(registerPlugin(fakePlugin('registry-test-ret'))).toBe('registry-test-ret');
  });

  it('lists ids of registered plugins', () => {
    registerPlugin(fakePlugin('registry-test-c'));
    expect(listPlugins()).toEqual(['registry-test-c']);
  });

  it('registerAndGetId registers the plugin and returns its id', () => {
    const plugin = fakePlugin('registry-test-d');
    const id = registerAndGetId(plugin);
    expect(id).toBe('registry-test-d');
    expect(getPlugin('registry-test-d')).toBe(plugin);
  });
});
