import React, { useState } from 'react';
import { useTheme } from '../theme/provider.js';
import type { VisualizationProps } from './types.js';
import type { DataRow, FieldMeta } from '../transforms/types.js';

const PAGE_SIZE = 25;

type SortDir = 'asc' | 'desc';

export function DataTable({ data, height }: VisualizationProps): React.ReactElement {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const fields: FieldMeta[] = data.fields.length > 0
    ? data.fields
    : Object.keys(data.rows[0] ?? {}).map((k) => ({ key: k, type: 'string' as const }));

  const sorted = [...data.rows].sort((a, b) => {
    if (!sortField) return 0;
    const av = a[sortField] ?? '';
    const bv = b[sortField] ?? '';
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortField === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(key); setSortDir('asc'); }
  };

  const th: React.CSSProperties = {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    textAlign: 'left',
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.fontSizeSm,
    color: theme.text.secondary,
    borderBottom: `2px solid ${theme.surface.border}`,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  const td: React.CSSProperties = {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    fontSize: theme.typography.fontSizeSm,
    borderBottom: `1px solid ${theme.surface.border}`,
    color: theme.text.primary,
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: theme.typography.fontFamily }}>
          <thead>
            <tr>
              {fields.map((f) => (
                <th key={f.key} style={th} onClick={() => handleSort(f.key)}>
                  {f.label ?? f.key}
                  {sortField === f.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? theme.surface.background : theme.surface.surface }}
              >
                {fields.map((f) => (
                  <td key={f.key} style={td} title={String(row[f.key] ?? '')}>
                    {formatCell(row, f)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          borderTop: `1px solid ${theme.surface.border}`,
          fontSize: theme.typography.fontSizeSm,
          color: theme.text.secondary,
        }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            style={{ cursor: page === 0 ? 'default' : 'pointer' }}>←</button>
          <span>Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            style={{ cursor: page === totalPages - 1 ? 'default' : 'pointer' }}>→</button>
        </div>
      )}
    </div>
  );
}

function formatCell(row: DataRow, field: FieldMeta): string {
  const val = row[field.key];
  if (val === null || val === undefined) return '—';
  if (field.type === 'number' && typeof val === 'number') {
    return val.toLocaleString();
  }
  return String(val);
}
