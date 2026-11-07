import type { ChainableTransform, DataRow, FieldMeta, TransformedData } from './types.js';

/**
 * Options for the `pivot` transform.
 *
 * @public
 */
export interface PivotOptions {
  /** Field whose values become new column headers. */
  columnField: string;
  /** Field whose values populate the pivot cells. */
  valueField: string;
  /** Fields that identify each row (remain as row headers). */
  rowFields: string[];
  /** Aggregation for duplicate cell values. Default: 'first'. */
  aggregation?: 'sum' | 'first' | 'last';
}

function rowKey(row: DataRow, keys: string[]): string {
  return keys.map((k) => String(row[k] ?? '')).join('\x00');
}

/**
 * Pivots a tall/long dataset into a wide format.
 *
 * @public
 */
export const pivot: ChainableTransform<PivotOptions> = {
  name: 'pivot',
  transform(data, options): TransformedData {
    if (!options) return data;
    const { columnField, valueField, rowFields, aggregation = 'first' } = options;

    // Collect unique column values
    const columnValues = [...new Set(data.rows.map((r) => String(r[columnField] ?? '')))].sort();

    // Build: rowKey → { rowFields, columnField → [values] }
    const rowMap = new Map<string, { base: DataRow; cells: Map<string, number[]> }>();

    for (const row of data.rows) {
      const key = rowKey(row, rowFields);
      if (!rowMap.has(key)) {
        const base: DataRow = {};
        for (const f of rowFields) base[f] = row[f] ?? null;
        rowMap.set(key, { base, cells: new Map() });
      }
      const entry = rowMap.get(key)!;
      const col = String(row[columnField] ?? '');
      const val = row[valueField];
      const num = typeof val === 'number' ? val : parseFloat(String(val ?? '0'));
      const existing = entry.cells.get(col) ?? [];
      existing.push(isNaN(num) ? 0 : num);
      entry.cells.set(col, existing);
    }

    const rows: DataRow[] = [];
    for (const { base, cells } of rowMap.values()) {
      const result: DataRow = { ...base };
      for (const col of columnValues) {
        const vals = cells.get(col) ?? [];
        if (vals.length === 0) {
          result[col] = null;
        } else if (aggregation === 'sum') {
          result[col] = vals.reduce((a, b) => a + b, 0);
        } else if (aggregation === 'last') {
          result[col] = vals[vals.length - 1] ?? null;
        } else {
          result[col] = vals[0] ?? null;
        }
      }
      rows.push(result);
    }

    const fields: FieldMeta[] = [
      ...rowFields.map((k) => ({ key: k, type: 'string' as const })),
      ...columnValues.map((k) => ({ key: k, type: 'number' as const })),
    ];

    return { ...data, rows, fields };
  },
};
