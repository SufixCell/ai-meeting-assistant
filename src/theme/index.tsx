import React, { createContext, useContext, useState, ReactNode } from 'react';

type ThemeName = 'midnight' | 'arctic' | 'executive';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceHighlight: string;
  primary: string;
  primaryGlow: string;
  success: string;
  danger: string;
  text: string;
  textMuted: string;
  border: string;
  purple: string;
  sky: string;
}

export interface Theme {
  name: ThemeName;
  colors: ThemeColors;
  spacing: typeof defaultSpacing;
  borderRadius: typeof defaultBorderRadius;
}

const defaultSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const defaultBorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
};

export const themes: Record<ThemeName, Theme> = {
  midnight: {
    name: 'midnight',
    colors: {
      background: '#09090B', // Near-black
      surface: 'rgba(255, 255, 255, 0.05)',
      surfaceHighlight: 'rgba(255, 255, 255, 0.10)',
      primary: '#3B82F6', // Blue accents
      primaryGlow: 'rgba(59, 130, 246, 0.15)',
      success: '#10B981',
      danger: '#EF4444',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      border: 'rgba(255, 255, 255, 0.10)',
      purple: '#8B5CF6',
      sky: '#38BDF8',
    },
    spacing: defaultSpacing,
    borderRadius: defaultBorderRadius,
  },
  arctic: {
    name: 'arctic',
    colors: {
      background: '#FFFFFF', // White
      surface: 'rgba(241, 245, 249, 0.8)', // Light gray
      surfaceHighlight: 'rgba(226, 232, 240, 0.8)',
      primary: '#3B82F6', // Soft blue
      primaryGlow: 'rgba(59, 130, 246, 0.15)',
      success: '#10B981',
      danger: '#EF4444',
      text: '#0F172A',
      textMuted: '#64748B',
      border: 'rgba(0, 0, 0, 0.05)',
      purple: '#7C3AED',
      sky: '#0EA5E9',
    },
    spacing: defaultSpacing,
    borderRadius: defaultBorderRadius,
  },
  executive: {
    name: 'executive',
    colors: {
      background: '#1A1A1A', // Dark graphite
      surface: 'rgba(255, 255, 255, 0.08)',
      surfaceHighlight: 'rgba(255, 255, 255, 0.12)',
      primary: '#D4AF37', // Muted gold
      primaryGlow: 'rgba(212, 175, 55, 0.15)',
      success: '#10B981',
      danger: '#EF4444',
      text: '#F3F4F6',
      textMuted: '#9CA3AF',
      border: 'rgba(212, 175, 55, 0.20)',
      purple: '#8B5CF6',
      sky: '#38BDF8',
    },
    spacing: defaultSpacing,
    borderRadius: defaultBorderRadius,
  }
};

// Legacy export for files not yet migrated to useTheme()
export const theme = themes.midnight;

interface ThemeContextType {
  theme: Theme;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.midnight,
  setThemeName: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeName, setThemeName] = useState<ThemeName>('midnight');

  return (
    <ThemeContext.Provider value={{ theme: themes[themeName], setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
