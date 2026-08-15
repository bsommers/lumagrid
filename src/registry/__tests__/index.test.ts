import { describe, it, expect, beforeEach } from 'vitest';
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
  beforeEach(() => {
    __resetRegistryForTests();
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
