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
  accent: string;
  accentMuted: string;
  warning: string;
  info: string;
  onPrimary: string;
  modalSurface: string;
  modalBorder: string;
  modalShadow: string;
}

export interface Theme {
  name: ThemeName;
  colors: ThemeColors;
  spacing: typeof defaultSpacing;
  borderRadius: typeof defaultBorderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
}

export const typography = {
  // Using native system fonts configured to look like SF Pro Display / General Sans
  display: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -1.2, lineHeight: 40 },
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.5, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.3, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.2, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  mono: { fontSize: 13, fontFamily: 'monospace' as const, letterSpacing: -0.2, lineHeight: 20 },
};

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 16 },
};

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
  md: 12,
  lg: 16,
  full: 9999,
};

export const themes: Record<ThemeName, Theme> = {
  midnight: {
    name: 'midnight',
    colors: {
      background: '#0A0A0C', // Deep atmospheric neutral
      surface: 'rgba(255, 255, 255, 0.03)', // Barely-there glass
      surfaceHighlight: 'rgba(255, 255, 255, 0.06)',
      primary: '#3B82F6', // Neon blue
      primaryGlow: 'rgba(59, 130, 246, 0.15)',
      success: '#10B981',
      danger: '#EF4444',
      text: '#F8FAFC',
      textMuted: '#8A8F98', // Soft graphite
      border: 'rgba(255, 255, 255, 0.08)', // Subtle inner borders
      purple: '#8B5CF6',
      sky: '#38BDF8',
      accent: '#8B5CF6', // Neon purple
      accentMuted: 'rgba(139, 92, 246, 0.12)',
      warning: '#F59E0B',
      info: '#38BDF8',
      onPrimary: '#000000',
      modalSurface: '#121214',
      modalBorder: 'rgba(255, 255, 255, 0.1)',
      modalShadow: 'rgba(0, 0, 0, 0.5)',
    },
    spacing: defaultSpacing,
    borderRadius: defaultBorderRadius,
    typography,
    shadows,
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
      accent: '#3B82F6',
      accentMuted: 'rgba(59,130,246,0.12)',
      warning: '#F59E0B',
      info: '#0EA5E9',
      onPrimary: '#FFFFFF',
      modalSurface: '#FFFFFF',
      modalBorder: 'rgba(0, 0, 0, 0.08)',
      modalShadow: 'rgba(0, 0, 0, 0.1)',
    },
    spacing: defaultSpacing,
    borderRadius: defaultBorderRadius,
    typography,
    shadows,
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
      accent: '#D4AF37',
      accentMuted: 'rgba(212,175,55,0.12)',
      warning: '#F59E0B',
      info: '#38BDF8',
      onPrimary: '#000000',
      modalSurface: '#1F1F1F',
      modalBorder: 'rgba(212, 175, 55, 0.3)',
      modalShadow: 'rgba(0, 0, 0, 0.6)',
    },
    spacing: defaultSpacing,
    borderRadius: defaultBorderRadius,
    typography,
    shadows,
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
