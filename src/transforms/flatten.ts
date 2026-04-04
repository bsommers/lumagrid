import type { DataRow, DataTransform, FieldMeta, TransformedData } from './types.js';

export interface FlattenOptions {
  /** Separator used when joining nested key paths. Default: '.' */
  separator?: string;
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix: string,
  separator: string,
  result: DataRow,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}${separator}${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value as Record<string, unknown>, fullKey, separator, result);
    } else if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[fullKey] = value;
    } else {
      result[fullKey] = String(value);
    }
  }
}

function inferType(values: Array<string | number | boolean | null>): FieldMeta['type'] {
  const nonNull = values.filter((v) => v !== null);
  if (nonNull.every((v) => typeof v === 'number')) return 'number';
  if (nonNull.every((v) => typeof v === 'boolean')) return 'boolean';
  if (
    nonNull.every(
      (v) => typeof v === 'string' && !isNaN(Date.parse(v as string)),
    )
  )
    return 'date';
  return 'string';
}

function deriveFields(rows: DataRow[]): FieldMeta[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0] ?? {});
  return keys.map((key) => ({
    key,
    type: inferType(rows.map((r) => r[key] ?? null)),
  }));
}

/**
 * Flattens an array of nested objects into a flat array of DataRows.
 */
export const flatten: DataTransform<unknown[], FlattenOptions> = {
  name: 'flatten',
  transform(data, options = {}): TransformedData {
    const separator = options.separator ?? '.';
    const rows: DataRow[] = data.map((item) => {
      const result: DataRow = {};
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        flattenObject(item as Record<string, unknown>, '', separator, result);
      }
      return result;
    });
    return { rows, fields: deriveFields(rows) };
  },
};
