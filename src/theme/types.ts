export interface ColorPalette {
  /** Categorical colors for series/groups (at least 8). */
  categorical: string[];
  /** Sequential scale: low → high (at least 5 stops). */
  sequential: string[];
  /** Diverging scale: low → mid → high (at least 5 stops, odd count). */
  diverging: string[];
}

export interface TypographyTokens {
  fontFamily: string;
  fontSizeBase: string;
  fontSizeSm: string;
  fontSizeLg: string;
  fontWeightNormal: number;
  fontWeightBold: number;
  lineHeight: number;
}

export interface SpacingTokens {
  /** Base unit in px. All spacing is a multiple of this. */
  base: number;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface SurfaceTokens {
  background: string;
  surface: string;
  border: string;
  borderRadius: string;
  shadowSm: string;
  shadowMd: string;
}

export interface TextTokens {
  primary: string;
  secondary: string;
  disabled: string;
  inverse: string;
}

export interface ThemeDefinition {
  name: string;
  colors: ColorPalette;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  surface: SurfaceTokens;
  text: TextTokens;
}
