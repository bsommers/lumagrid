/** Height in px of one legend row. */
const LEGEND_ROW = 22;

/**
 * Height in px to reserve below the plot for a wrapping HTML legend, so chart + legend fit the
 * given height. Estimates item widths (swatch + label + gap) to count the rows at `availWidth`.
 */
export function legendHeight(labels: string[], availWidth: number): number {
  let rows = 1;
  let used = 0;
  for (const label of labels) {
    const w = 12 + 6 + label.length * 7 + 16;
    if (used > 0 && used + w > availWidth) { rows += 1; used = 0; }
    used += w;
  }
  return rows * LEGEND_ROW + 6;
}

/** Round a range to "nice" tick values (1, 2, 5 x 10^n steps) that cover [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) { min -= 1; max += 1; }
  const raw = (max - min) / Math.max(count - 1, 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}
