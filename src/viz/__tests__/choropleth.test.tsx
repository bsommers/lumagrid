import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Choropleth } from '../choropleth.js';
import { lightTheme } from '../../theme/light.js';
import type { GeoFeature, TransformedData } from '../../transforms/types.js';

const feat = (id: string, props: GeoFeature['properties']): GeoFeature => ({
  type: 'Feature', id, properties: props, geometry: { type: 'Polygon', coordinates: [] },
});
const geo = (features: GeoFeature[]): TransformedData => ({
  rows: [], fields: [], geo: { type: 'FeatureCollection', features },
});
const draw = (data: TransformedData, o: Partial<React.ComponentProps<typeof Choropleth>> = {}) =>
  render(<Choropleth data={data} width={400} height={300} theme={lightTheme} {...o} />);

describe('Choropleth', () => {
  it('asks for GeoData when none is attached', () => {
    const { container } = draw({ rows: [], fields: [] });
    expect(container.textContent).toContain('requires a GeoData');
  });

  it('renders a placeholder when no projectedPaths are given', () => {
    const { container } = draw(geo([feat('a', { value: 1 }), feat('b', { value: 2 })]));
    expect(container.querySelector('svg')).toBeNull();
    expect(container.textContent).toContain('2 features loaded');
  });

  it('renders one path per feature that has a projected path', () => {
    const { container } = draw(
      geo([feat('a', { value: 1, name: 'Alpha' }), feat('b', { value: 5 }), feat('c', { value: 3 })]),
      { projectedPaths: { a: 'M0,0L1,1Z', b: 'M2,2L3,3Z' } },
    );
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(2);
    expect(paths[0]!.querySelector('title')!.textContent).toContain('Alpha');
    expect(paths[0]!.getAttribute('fill')).not.toBe(paths[1]!.getAttribute('fill'));
  });

  it('sets role img and aria-label', () => {
    const { container } = draw(geo([feat('a', { value: 1 })]), { projectedPaths: { a: 'M0,0Z' }, ariaLabel: 'Map' });
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Map');
  });

  it('uses the border color for missing, null and NaN values without NaN colors', () => {
    const { container } = draw(
      geo([feat('a', { value: null }), feat('b', { value: NaN }), feat('c', { other: 1 }), feat('d', { value: 2 })]),
      { projectedPaths: { a: 'M0,0Z', b: 'M1,1Z', c: 'M2,2Z', d: 'M3,3Z' } },
    );
    const fills = [...container.querySelectorAll('path')].map((p) => p.getAttribute('fill'));
    expect(fills.slice(0, 3)).toEqual(Array(3).fill(lightTheme.surface.border));
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('handles zero features and a single feature', () => {
    const empty = draw(geo([]), { projectedPaths: {} });
    expect(empty.container.querySelectorAll('path')).toHaveLength(0);
    const single = draw(geo([feat('a', { value: 7 })]), { projectedPaths: { a: 'M0,0Z' } });
    expect(single.container.querySelector('path')!.getAttribute('fill')).not.toContain('NaN');
  });

  it('placeholder legend has finite min/max with no numeric values', () => {
    const { container } = draw(geo([feat('a', { value: null })]));
    expect(container.innerHTML).not.toContain('Infinity');
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('honours valueProperty over yField', () => {
    const { container } = draw(geo([feat('a', { pop: 1 }), feat('b', { pop: 9 })]), {
      valueProperty: 'pop', yField: 'ignored', projectedPaths: { a: 'M0,0Z', b: 'M1,1Z' },
    });
    const [a, b] = container.querySelectorAll('path');
    expect(a!.getAttribute('fill')).not.toBe(b!.getAttribute('fill'));
  });

  describe('color property precedence', () => {
    const features = geo([
      feat('a', { pop: 1, area: 5, val: 5 }),
      feat('b', { pop: 9, area: 5, val: 6 }),
    ]);
    const paths = { a: 'M0,0Z', b: 'M1,1Z' };
    const fills = (c: HTMLElement) => [...c.querySelectorAll('path')].map((p) => p.getAttribute('fill'));

    it('colors by valueField', () => {
      const { container } = draw(features, { valueField: 'pop', projectedPaths: paths });
      const [a, b] = fills(container);
      expect(a).not.toBe(b);
    });

    it('lets valueProperty win over valueField', () => {
      // area is constant, so a constant color pair proves valueProperty (not pop) was used
      const { container } = draw(features, { valueProperty: 'area', valueField: 'pop', projectedPaths: paths });
      const [a, b] = fills(container);
      expect(a).toBe(b);
    });

    it('lets valueField win over yField', () => {
      const { container } = draw(features, { valueField: 'area', yField: 'pop', projectedPaths: paths });
      const [a, b] = fills(container);
      expect(a).toBe(b);
    });

    it('falls back to yField, then to value', () => {
      const viaY = draw(features, { yField: 'pop', projectedPaths: paths });
      const [ya, yb] = fills(viaY.container);
      expect(ya).not.toBe(yb);
      const viaValue = draw(geo([feat('a', { value: 1 }), feat('b', { value: 9 })]), { projectedPaths: paths });
      const [va, vb] = fills(viaValue.container);
      expect(va).not.toBe(vb);
    });
  });
});
