import React, { createContext, useContext, useMemo } from 'react';
import type { ThemeDefinition } from './types.js';
import { lightTheme } from './light.js';
import { darkTheme } from './dark.js';

const ThemeContext = createContext<ThemeDefinition>(lightTheme);

export interface ThemeProviderProps {
  /**
   * Pass a ThemeDefinition object for full control,
   * or a shorthand string: 'light' | 'dark'.
   */
  theme: ThemeDefinition | 'light' | 'dark';
  children: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps): React.ReactElement {
  const resolved = useMemo<ThemeDefinition>(() => {
    if (theme === 'light') return lightTheme;
    if (theme === 'dark') return darkTheme;
    return theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={resolved}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Returns the current ThemeDefinition from the nearest ThemeProvider. */
export function useTheme(): ThemeDefinition {
  return useContext(ThemeContext);
}
