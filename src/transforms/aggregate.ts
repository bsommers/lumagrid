import type { ChainableTransform, DataRow, FieldMeta, TransformedData } from './types.js';

export type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last';

export interface AggregateOptions {
  groupBy: string[];
  aggregations: Record<string, AggregationFn>;
}

function applyAgg(values: number[], fn: AggregationFn): number {
  if (values.length === 0) return 0;
  switch (fn) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    case 'first':
      return values[0] ?? 0;
    case 'last':
      return values[values.length - 1] ?? 0;
  }
}

function groupKey(row: DataRow, keys: string[]): string {
  return keys.map((k) => String(row[k] ?? '')).join('\x00');
}

/**
 * Groups rows and applies aggregation functions to numeric fields.
 */
export const aggregate: ChainableTransform<AggregateOptions> = {
  name: 'aggregate',
  transform(data, options): TransformedData {
    if (!options) return data;
    const { groupBy: groupKeys, aggregations } = options;

    const groups = new Map<string, DataRow[]>();
    for (const row of data.rows) {
      const key = groupKey(row, groupKeys);
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(row);
      } else {
        groups.set(key, [row]);
      }
    }

    const rows: DataRow[] = [];
    for (const bucket of groups.values()) {
      const representative = bucket[0] ?? {};
      const result: DataRow = {};
      for (const k of groupKeys) {
        result[k] = representative[k] ?? null;
      }
      for (const [field, fn] of Object.entries(aggregations)) {
        if (fn === 'count') {
          result[field] = bucket.length;
        } else {
          const values = bucket
            .map((r) => r[field])
            .filter((v): v is number => typeof v === 'number');
          result[field] = applyAgg(values, fn);
        }
      }
      rows.push(result);
    }

    const fields: FieldMeta[] = [
      ...groupKeys.map((k) => ({ key: k, type: 'string' as const })),
      ...Object.keys(aggregations).map((k) => ({ key: k, type: 'number' as const })),
    ];

    return { ...data, rows, fields };
  },
};
