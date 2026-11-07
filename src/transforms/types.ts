/**
 * A row of data with string keys and primitive values.
 *
 * @public
 */
export type DataRow = Record<string, string | number | boolean | null>;

/**
 * The normalized output produced by any transform.
 * `rows` is always present; `hierarchy` and `geo` are populated by specific transforms.
 *
 * @public
 */
export interface TransformedData {
  rows: DataRow[];
  fields: FieldMeta[];
  hierarchy?: HierarchyNode;
  geo?: GeoData;
  meta?: Record<string, unknown>;
}

/**
 * Metadata describing one column of a `TransformedData` result.
 *
 * @public
 */
export interface FieldMeta {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  label?: string;
}

/**
 * A node in the hierarchy produced by transforms such as `groupBy`.
 *
 * @public
 */
export interface HierarchyNode {
  id: string;
  label: string;
  value?: number;
  children?: HierarchyNode[];
  data?: DataRow;
}

/**
 * A GeoJSON feature collection carried on `TransformedData`.
 *
 * @public
 */
export interface GeoData {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

/**
 * A single GeoJSON feature with a string id and primitive properties.
 *
 * @public
 */
export interface GeoFeature {
  type: 'Feature';
  id: string;
  properties: Record<string, string | number | null>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

/**
 * A stateless, pure data transformation.
 * TIn defaults to unknown so callers can pass raw data from any source.
 *
 * @public
 */
export interface DataTransform<TIn = unknown, TOptions = Record<string, unknown>> {
  readonly name: string;
  transform(data: TIn, options?: TOptions): TransformedData;
}

/**
 * A transform that accepts already-transformed data (used in pipelines after the first step).
 *
 * Transforms that take options (`aggregate`, `pivot`, `geoNormalize`) are pre-configured objects
 * called as `transform(data, options)`, while `groupBy` is a factory that returns a configured transform.
 * Inside a `TransformPipeline` a step that needs options must be closed over its options.
 *
 * @public
 */
export interface ChainableTransform<TOptions = Record<string, unknown>> {
  readonly name: string;
  transform(data: TransformedData, options?: TOptions): TransformedData;
}
