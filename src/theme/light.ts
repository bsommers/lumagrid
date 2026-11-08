import type { ThemeDefinition } from './types.js';

/**
 * The built-in light theme.
 *
 * @public
 */
export const lightTheme: ThemeDefinition = {
  name: 'light',
  colors: {
    categorical: [
      '#4e79a7', '#f28e2b', '#e15759', '#76b7b2',
      '#59a14f', '#edc948', '#b07aa1', '#ff9da7',
    ],
    sequential: ['#f7fbff', '#c6dbef', '#6baed6', '#2171b5', '#084594'],
    diverging:  ['#d73027', '#fc8d59', '#fee090', '#91bfdb', '#4575b4'],
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
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
    borderRadius: '6px',
    shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
    shadowMd: '0 4px 6px rgba(0,0,0,0.07)',
  },
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    disabled: '#d1d5db',
    inverse: '#ffffff',
  },
};
