// Single description of the chart image matrix shared by render-visuals.mjs and
// check-visuals.mjs (D-14). Plain data plus one helper; no side effects.

/** Chart ids in capture order (they match site/src/capture.tsx). */
export const CHARTS = ['bar', 'line', 'pie', 'force', 'choropleth', 'table', 'tree', 'scatter', 'area', 'column', 'heatmap'];

/** Library themes captured for every chart. */
export const THEMES = ['light', 'dark'];

/** Charts drawn as SVG; the rest are HTML and get PNG output only. */
export const SVG_CHARTS = ['bar', 'line', 'pie', 'force', 'choropleth', 'scatter', 'area', 'column', 'heatmap'];

/** Capture element size in CSS pixels (matches CAPTURE_WIDTH and CAPTURE_HEIGHT in capture.tsx). */
export const CAPTURE_BOX = { width: 640, height: 400 };

/** Device scale factor used for captures. */
export const SCALE = 2;

/** Expected PNG size in pixels. */
export const PNG_SIZE = { width: CAPTURE_BOX.width * SCALE, height: CAPTURE_BOX.height * SCALE };

/** Output folder, relative to the repository root. */
export const OUT_DIR = 'docs/assets/charts';

/**
 * Parse a `--only` selector: `<chart>` or `<chart>:<theme>`.
 * @param {string | undefined} only
 * @returns {{ chart: string, theme: string | null } | null} null when no selector is given
 */
export function parseOnly(only) {
  if (only === undefined || only === '') return null;
  const [chart, theme = null] = only.split(':');
  if (!CHARTS.includes(chart)) throw new Error(`--only: unknown chart "${chart}" (expected one of ${CHARTS.join(', ')})`);
  if (theme !== null && !THEMES.includes(theme)) {
    throw new Error(`--only: unknown theme "${theme}" (expected one of ${THEMES.join(', ')})`);
  }
  return { chart, theme };
}

/**
 * Every expected `[chart, theme]` pair, optionally narrowed by a parsed selector.
 * @param {{ chart: string, theme: string | null } | null} [selector]
 * @returns {{ chart: string, theme: string }[]}
 */
export function selectedPairs(selector = null) {
  const pairs = [];
  for (const chart of CHARTS) {
    for (const theme of THEMES) {
      if (selector && (selector.chart !== chart || (selector.theme !== null && selector.theme !== theme))) continue;
      pairs.push({ chart, theme });
    }
  }
  return pairs;
}

/**
 * Every expected file name (`<chart>-<theme>.png` and, for SVG charts, `<chart>-<theme>.svg`).
 * @param {{ chart: string, theme: string | null } | null} [selector]
 * @returns {string[]}
 */
export function expectedFiles(selector = null) {
  const names = [];
  for (const { chart, theme } of selectedPairs(selector)) {
    names.push(`${chart}-${theme}.png`);
    if (SVG_CHARTS.includes(chart)) names.push(`${chart}-${theme}.svg`);
  }
  return names;
}
