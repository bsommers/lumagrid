/**
 * Color scales (categorical, sequential, diverging) carried by a theme.
 *
 * @public
 */
export interface ColorPalette {
  /** Categorical colors for series/groups (at least 8). */
  categorical: string[];
  /** Sequential scale: low → high (at least 5 stops). */
  sequential: string[];
  /** Diverging scale: low → mid → high (at least 5 stops, odd count). */
  diverging: string[];
}

/**
 * Font family, size, weight and line-height tokens of a theme.
 *
 * @public
 */
export interface TypographyTokens {
  fontFamily: string;
  fontSizeBase: string;
  fontSizeSm: string;
  fontSizeLg: string;
  fontWeightNormal: number;
  fontWeightBold: number;
  lineHeight: number;
}

/**
 * Spacing tokens of a theme, all multiples of a base unit.
 *
 * @public
 */
export interface SpacingTokens {
  /** Base unit in px. All spacing is a multiple of this. */
  base: number;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Background, border, radius and shadow tokens of a theme.
 *
 * @public
 */
export interface SurfaceTokens {
  background: string;
  surface: string;
  border: string;
  borderRadius: string;
  shadowSm: string;
  shadowMd: string;
}

/**
 * Text color tokens of a theme.
 *
 * @public
 */
export interface TextTokens {
  primary: string;
  secondary: string;
  disabled: string;
  inverse: string;
}

/**
 * Complete theme: name plus color, typography, spacing, surface and text tokens.
 *
 * @public
 */
export interface ThemeDefinition {
  name: string;
  colors: ColorPalette;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  surface: SurfaceTokens;
  text: TextTokens;
}
