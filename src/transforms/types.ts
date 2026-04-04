/**
 * A row of data with string keys and primitive values.
 */
export type DataRow = Record<string, string | number | boolean | null>;

/**
 * The normalized output produced by any transform.
 * `rows` is always present; `hierarchy` and `geo` are populated by specific transforms.
 */
export interface TransformedData {
  rows: DataRow[];
  fields: FieldMeta[];
  hierarchy?: HierarchyNode;
  geo?: GeoData;
  meta?: Record<string, unknown>;
}

export interface FieldMeta {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  label?: string;
}

export interface HierarchyNode {
  id: string;
  label: string;
  value?: number;
  children?: HierarchyNode[];
  data?: DataRow;
}

export interface GeoData {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

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
 */
export interface DataTransform<TIn = unknown, TOptions = Record<string, unknown>> {
  readonly name: string;
  transform(data: TIn, options?: TOptions): TransformedData;
}

/**
 * A transform that accepts already-transformed data (used in pipelines after the first step).
 */
export interface ChainableTransform<TOptions = Record<string, unknown>> {
  readonly name: string;
  transform(data: TransformedData, options?: TOptions): TransformedData;
}
