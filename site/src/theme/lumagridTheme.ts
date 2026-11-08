import type { ThemeDefinition } from 'lumagrid/theme';

/**
 * The neon chart theme of the showcase site. Surface and text colors are the values in
 * brand/tokens.css (site/src/__tests__/tokens.test.ts keeps them in step and checks contrast).
 */
export const lumagridTheme: ThemeDefinition = {
  name: 'lumagrid-neon',
  colors: {
    // Every color has at least 3:1 contrast against the page background #05070A.
    categorical: [
      '#00E5FF', '#FF2BD6', '#7DF9FF', '#FFB020',
      '#A78BFA', '#4ADE80', '#FF6B6B', '#F5E960',
    ],
    // Cyan ramp, low to high; the darkest step still reads against the background.
    sequential: ['#0E7C8F', '#0AA6BD', '#00C8E0', '#4DE3F5', '#B8F7FF'],
    // Magenta (low) through a light neutral to cyan (high).
    diverging: ['#FF2BD6', '#FF86E9', '#E6EDF3', '#6BEFFF', '#00E5FF'],
  },
  typography: {
    fontFamily: "'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif",
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
    background: '#05070A',
    surface: '#0B0F14',
    border: '#1F2A37',
    borderRadius: '8px',
    shadowSm: '0 1px 2px rgba(0,0,0,0.5)',
    shadowMd: '0 4px 12px rgba(0,229,255,0.12)',
  },
  text: {
    primary: '#E6EDF3',
    secondary: '#9AA4B2',
    disabled: '#7D8794',
    inverse: '#05070A',
  },
};
