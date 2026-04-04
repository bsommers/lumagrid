import type { ChainableTransform, DataRow, FieldMeta, HierarchyNode, TransformedData } from './types.js';

export interface GroupByOptions {
  /** Field to group by. */
  field: string;
  /** Optional numeric field to sum as the group value. */
  valueField?: string;
  /** Label field for the root node. */
  rootLabel?: string;
}

/**
 * Groups rows by a field and produces both a flat grouped representation
 * and a two-level hierarchy (root → group children).
 */
export const groupBy: ChainableTransform<GroupByOptions> | ((field: string, valueField?: string) => ChainableTransform<GroupByOptions>) = (
  field: string,
  valueField?: string,
): ChainableTransform<GroupByOptions> => ({
  name: 'groupBy',
  transform(data, options): TransformedData {
    const resolvedField = options?.field ?? field;
    const resolvedValueField = options?.valueField ?? valueField;

    const groups = new Map<string, DataRow[]>();
    for (const row of data.rows) {
      const key = String(row[resolvedField] ?? '(blank)');
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(row);
      } else {
        groups.set(key, [row]);
      }
    }

    // Build summary rows: one per group with count + optional sum
    const rows: DataRow[] = [];
    for (const [key, bucket] of groups.entries()) {
      const summary: DataRow = { [resolvedField]: key, count: bucket.length };
      if (resolvedValueField) {
        const sum = bucket
          .map((r) => r[resolvedValueField!])
          .filter((v): v is number => typeof v === 'number')
          .reduce((a, b) => a + b, 0);
        summary[resolvedValueField] = sum;
      }
      rows.push(summary);
    }

    const fields: FieldMeta[] = [
      { key: resolvedField, type: 'string' },
      { key: 'count', type: 'number' },
      ...(resolvedValueField ? [{ key: resolvedValueField, type: 'number' as const }] : []),
    ];

    // Build hierarchy
    const children: HierarchyNode[] = [];
    for (const [key, bucket] of groups.entries()) {
      const value = resolvedValueField
        ? bucket
            .map((r) => r[resolvedValueField!])
            .filter((v): v is number => typeof v === 'number')
            .reduce((a, b) => a + b, 0)
        : bucket.length;
      const nodeData = bucket[0];
      children.push({ id: key, label: key, value, ...(nodeData !== undefined ? { data: nodeData } : {}) });
    }

    const hierarchy: HierarchyNode = {
      id: 'root',
      label: options?.rootLabel ?? resolvedField,
      children,
    };

    return { ...data, rows, fields, hierarchy };
  },
});
