/**
 * Return the text between the lines `// #region <name>` and `// #endregion` of `raw`, with the
 * common indentation removed and surrounding blank lines trimmed. Throws when the region is missing
 * or never closed.
 */
export function extractRegion(raw: string, name: string): string {
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `// #region ${name}`);
  if (start < 0) throw new Error(`Region "${name}" not found`);
  const end = lines.findIndex((l, i) => i > start && l.trim() === '// #endregion');
  if (end < 0) throw new Error(`Region "${name}" has no // #endregion line`);
  const body = lines.slice(start + 1, end);
  const indents = body.filter((l) => l.trim() !== '').map((l) => (/^[ \t]*/.exec(l) ?? [''])[0]?.length ?? 0);
  const strip = indents.length > 0 ? Math.min(...indents) : 0;
  const text = body.map((l) => l.slice(Math.min(strip, l.length))).join('\n');
  return text.replace(/^\s*\n/, '').replace(/\n\s*$/, '').replace(/\s+$/, '');
}
