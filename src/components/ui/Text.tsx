import React from 'react';
import { Text as RNText, TextProps, StyleSheet, Platform } from 'react-native';
import { useTheme, typography } from '../../theme';

type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label' | 'mono';

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  muted?: boolean;
  color?: string;
}

const defaultFontFamily = Platform.OS === 'ios' ? 'System' : 'sans-serif';

export function Text({ variant = 'body', muted, color, style, ...props }: ThemedTextProps) {
  const { theme } = useTheme();
  const typoStyle = typography[variant];
  
  return (
    <RNText
      style={[
        variant === 'mono' ? { fontFamily: 'monospace' } : {},
        typoStyle,
        { color: color ?? (muted ? theme.colors.textMuted : theme.colors.text) },
        style,
      ]}
      {...props}
    />
  );
}
