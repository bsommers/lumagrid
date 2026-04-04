import type { ChainableTransform, GeoData, GeoFeature, TransformedData } from './types.js';

export interface GeoNormalizeOptions {
  /**
   * Field in each row that matches a feature ID in the GeoJSON.
   * Default: 'id'
   */
  idField?: string;
  /** GeoJSON FeatureCollection to join against. */
  geoJson: GeoData;
}

/**
 * Joins tabular rows to GeoJSON features by a shared ID field,
 * copying all row properties into each feature's `properties`.
 */
export const geoNormalize: ChainableTransform<GeoNormalizeOptions> = {
  name: 'geoNormalize',
  transform(data, options): TransformedData {
    if (!options) return data;
    const { idField = 'id', geoJson } = options;

    // Build lookup: featureId → row
    const rowById = new Map<string, typeof data.rows[number]>();
    for (const row of data.rows) {
      const key = String(row[idField] ?? '');
      rowById.set(key, row);
    }

    const features: GeoFeature[] = geoJson.features.map((feature) => {
      const row = rowById.get(feature.id);
      const mergedProperties: Record<string, string | number | null> = {
        ...feature.properties,
      };
      if (row) {
        for (const [k, v] of Object.entries(row)) {
          if (v === null || typeof v === 'string' || typeof v === 'number') {
            mergedProperties[k] = v;
          } else if (typeof v === 'boolean') {
            mergedProperties[k] = v ? 1 : 0;
          }
        }
      }
      return { ...feature, properties: mergedProperties };
    });

    const geo: GeoData = { type: 'FeatureCollection', features };
    return { ...data, geo };
  },
};
