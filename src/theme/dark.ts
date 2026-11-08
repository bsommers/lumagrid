import type { ThemeDefinition } from './types.js';

/**
 * The built-in dark theme.
 *
 * @public
 */
export const darkTheme: ThemeDefinition = {
  name: 'dark',
  colors: {
    categorical: [
      '#4e9af7', '#f5a442', '#f06b6d', '#4dc4be',
      '#6dbd64', '#f5d860', '#c48dc4', '#ff9da7',
    ],
    sequential: ['#08306b', '#2171b5', '#4292c6', '#9ecae1', '#deebf7'],
    diverging:  ['#4575b4', '#74add1', '#fee090', '#f46d43', '#d73027'],
  },
  typography: {
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    fontSizeBase: '14px',
    fontSizeSm: '12px',
    fontSizeLg: '16px',
    fontWeightNormal: 400,
    fontWeightBold: 600,
    lineHeight: 1.5,
  },
  spacing: {
    base: 8,
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  surface: {
    background: '#111827',
    surface: '#1f2937',
    border: '#374151',
    borderRadius: '6px',
    shadowSm: '0 1px 2px rgba(0,0,0,0.3)',
    shadowMd: '0 4px 6px rgba(0,0,0,0.4)',
  },
  text: {
    primary: '#f9fafb',
    secondary: '#9ca3af',
    disabled: '#4b5563',
    inverse: '#111827',
  },
};
