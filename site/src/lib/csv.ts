import type { DataRow, FieldMeta, TransformedData } from 'lumagrid';

export const MAX_CSV_CHARS = 100_000;
export const MAX_CSV_ROWS = 2_000;

export type CsvResult = { ok: true; data: TransformedData } | { ok: false; error: string };

/** Split one CSV line, honouring double-quoted cells ("" is an escaped quote). */
function splitLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { cells.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

/** Parse CSV text into TransformedData. Never throws; returns a friendly error instead. */
export function parseCsv(text: string): CsvResult {
  if (text.length > MAX_CSV_CHARS) return { ok: false, error: `That is too much text. Keep it under ${MAX_CSV_CHARS.toLocaleString()} characters.` };
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { ok: false, error: 'Paste some CSV: a header row, then one row per record.' };
  if (lines.length < 2) return { ok: false, error: 'Add at least one data row under the header.' };
  if (lines.length - 1 > MAX_CSV_ROWS) return { ok: false, error: `Too many rows. This demo reads up to ${MAX_CSV_ROWS.toLocaleString()}.` };
  const header = splitLine(lines[0] ?? '');
  if (header.some((h) => h === '')) return { ok: false, error: 'Every column in the header row needs a name.' };
  if (new Set(header).size !== header.length) return { ok: false, error: 'Column names must be unique.' };
  const cells: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = splitLine(lines[i] ?? '');
    if (row.length !== header.length) {
      return { ok: false, error: `Row ${i} has ${row.length} value${row.length === 1 ? '' : 's'} but the header has ${header.length}.` };
    }
    cells.push(row);
  }
  const fields: FieldMeta[] = header.map((key, c) => ({
    key,
    type: cells.every((r) => (r[c] ?? '') !== '' && Number.isFinite(Number(r[c]))) ? 'number' : 'string',
  }));
  const rows: DataRow[] = cells.map((r) => {
    const row: DataRow = {};
    fields.forEach((f, c) => { row[f.key] = f.type === 'number' ? Number(r[c]) : (r[c] ?? ''); });
    return row;
  });
  return { ok: true, data: { rows, fields } };
}
