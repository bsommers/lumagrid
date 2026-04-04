import type { ThemeDefinition } from './types.js';

/** Returns one of the theme's categorical colors by index (wraps around). */
export function categoricalColor(theme: ThemeDefinition, index: number): string {
  const palette = theme.colors.categorical;
  return palette[index % palette.length] ?? palette[0] ?? '#4e79a7';
}

/**
 * Maps a value in [0, 1] to a color on the theme's sequential scale.
 * Uses linear interpolation between the nearest two stops.
 */
export function sequentialColor(theme: ThemeDefinition, t: number): string {
  const palette = theme.colors.sequential;
  return interpolatePalette(palette, Math.max(0, Math.min(1, t)));
}

/**
 * Maps a value in [-1, 1] to a color on the theme's diverging scale.
 * 0 maps to the midpoint, ±1 to the extremes.
 */
export function divergingColor(theme: ThemeDefinition, t: number): string {
  const palette = theme.colors.diverging;
  // Remap [-1, 1] → [0, 1]
  return interpolatePalette(palette, Math.max(0, Math.min(1, (t + 1) / 2)));
}

function interpolatePalette(palette: string[], t: number): string {
  if (palette.length === 0) return '#000000';
  if (palette.length === 1) return palette[0] ?? '#000000';

  const scaled = t * (palette.length - 1);
  const low = Math.floor(scaled);
  const high = Math.min(low + 1, palette.length - 1);
  const fraction = scaled - low;

  const c1 = hexToRgb(palette[low] ?? '#000000');
  const c2 = hexToRgb(palette[high] ?? '#000000');

  const r = Math.round(c1[0] + (c2[0] - c1[0]) * fraction);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * fraction);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * fraction);

  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Creates a threshold-based color mapper.
 * Values below thresholds[0] → colors[0], etc.
 */
export function thresholdScale(
  thresholds: number[],
  colors: string[],
): (value: number) => string {
  if (colors.length !== thresholds.length + 1) {
    throw new Error('colors must have one more entry than thresholds');
  }
  return (value: number) => {
    for (let i = 0; i < thresholds.length; i++) {
      if (value < (thresholds[i] ?? 0)) return colors[i] ?? '#000000';
    }
    return colors[colors.length - 1] ?? '#000000';
  };
}
