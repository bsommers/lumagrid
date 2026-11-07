import { describe, it, expect } from 'vitest';
import { geoNormalize } from '../geo-normalize.js';
import type { GeoData, TransformedData } from '../types.js';

const geoJson: GeoData = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', id: 'CA', properties: { name: 'California', value: 0 }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', id: 'NY', properties: { name: 'New York' }, geometry: { type: 'Polygon', coordinates: [] } },
  ],
};

const data: TransformedData = {
  rows: [
    { id: 'CA', value: 39, flag: true, note: null },
    { id: 'TX', value: 30, flag: false, note: 'unmatched' },
  ],
  fields: [{ key: 'id', type: 'string' }],
};

describe('geoNormalize', () => {
  it('returns the input unchanged when no options are given', () => {
    expect(geoNormalize.transform(data)).toBe(data);
  });

  it('merges matching row values into feature properties, overriding existing keys', () => {
    const out = geoNormalize.transform(data, { geoJson });
    const ca = out.geo?.features.find((f) => f.id === 'CA');
    expect(ca?.properties).toEqual({ name: 'California', id: 'CA', value: 39, flag: 1, note: null });
  });

  it('leaves unmatched features untouched and ignores rows with no feature', () => {
    const out = geoNormalize.transform(data, { geoJson });
    expect(out.geo?.features.map((f) => f.id)).toEqual(['CA', 'NY']);
    expect(out.geo?.features[1]?.properties).toEqual({ name: 'New York' });
  });

  it('converts false booleans to 0', () => {
    const out = geoNormalize.transform(
      { rows: [{ id: 'NY', flag: false }], fields: [] },
      { geoJson },
    );
    expect(out.geo?.features[1]?.properties['flag']).toBe(0);
  });

  it('joins on a custom idField and preserves rows/fields', () => {
    const rows = [{ code: 'NY', pop: 19 }];
    const out = geoNormalize.transform({ rows, fields: [] }, { geoJson, idField: 'code' });
    expect(out.geo?.features[1]?.properties['pop']).toBe(19);
    expect(out.rows).toBe(rows);
  });

  it('does not mutate the source GeoJSON', () => {
    geoNormalize.transform(data, { geoJson });
    expect(geoJson.features[0]?.properties).toEqual({ name: 'California', value: 0 });
  });
});
