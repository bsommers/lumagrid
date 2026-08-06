import { describe, it, expect } from 'vitest';
import { nivoThemeAdapter, createNivoPlugin } from '../nivo-adapter.js';
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

describe('nivoThemeAdapter', () => {
  const result = nivoThemeAdapter(fakeTheme);

  it('maps background from surface.background', () => {
    expect(result.background).toBe('#aaaaaa');
  });

  it('maps text fontFamily, fontSize, and fill', () => {
    expect(result.text).toEqual({ fontFamily: 'Fake Sans', fontSize: 11, fill: '#000002' });
  });

  it('maps axis domain/ticks/legend from surface.border and text tokens', () => {
    expect(result.axis).toEqual({
      domain: { line: { stroke: '#cccccc' } },
      ticks: { line: { stroke: '#cccccc' }, text: { fill: '#000002', fontSize: 11 } },
      legend: { text: { fill: '#000001', fontSize: 11 } },
    });
  });

  it('maps grid line stroke from surface.border', () => {
    expect(result.grid).toEqual({ line: { stroke: '#cccccc' } });
  });

  it('maps tooltip container from surface.surface and text.primary', () => {
    expect(result.tooltip).toEqual({
      container: { background: '#bbbbbb', color: '#000001', fontSize: 11 },
    });
  });

  it('maps colors from colors.categorical', () => {
    expect(result.colors).toEqual(['#111111', '#222222']);
  });

  it('parses fontSizeSm string into a numeric fontSize', () => {
    expect(typeof result.text.fontSize).toBe('number');
  });
});

describe('createNivoPlugin', () => {
  const data: TransformedData = { rows: [], fields: [] };

  it('passes dataAdapter through unchanged', () => {
    const dataAdapter = (d: TransformedData) => d.rows.length;
    const plugin = createNivoPlugin({
      id: 'nivo-test',
      dataAdapter,
      Renderer: () => null,
    });
    expect(plugin.dataAdapter).toBe(dataAdapter);
    expect(plugin.dataAdapter(data)).toBe(0);
  });

  it('passes Renderer through unchanged', () => {
    const Renderer = () => null;
    const plugin = createNivoPlugin({
      id: 'nivo-test-2',
      dataAdapter: (d) => d.rows,
      Renderer,
    });
    expect(plugin.Renderer).toBe(Renderer);
  });

  it('defaults label to id when no label is given', () => {
    const plugin = createNivoPlugin({
      id: 'nivo-test-3',
      dataAdapter: (d) => d.rows,
      Renderer: () => null,
    });
    expect(plugin.label).toBe('nivo-test-3');
  });

  it('uses the provided label when given', () => {
    const plugin = createNivoPlugin({
      id: 'nivo-test-4',
      label: 'My Nivo Chart',
      dataAdapter: (d) => d.rows,
      Renderer: () => null,
    });
    expect(plugin.label).toBe('My Nivo Chart');
  });

  it('uses nivoThemeAdapter as the themeAdapter', () => {
    const plugin = createNivoPlugin({
      id: 'nivo-test-5',
      dataAdapter: (d) => d.rows,
      Renderer: () => null,
    });
    expect(plugin.themeAdapter(fakeTheme)).toEqual(nivoThemeAdapter(fakeTheme));
  });
});
