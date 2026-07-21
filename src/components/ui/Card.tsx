import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, shadows } from '../../theme';
import { AnimatedPressable } from '../animated-pressable';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  shadow?: boolean;
  variant?: 'glass' | 'solid' | 'ghost';
}

export function Card({ children, style, onPress, padding = 16, shadow = false, variant = 'solid' }: CardProps) {
  const { theme } = useTheme();
  
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderTopColor: 'rgba(255,255,255,0.08)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: 'transparent',
        };
      case 'solid':
      default:
        return {
          backgroundColor: theme.colors.surfaceHighlight,
          borderWidth: 1,
          borderColor: 'transparent',
          borderTopColor: 'rgba(255,255,255,0.04)',
        };
    }
  };

  const cardStyle: ViewStyle[] = [
    {
      borderRadius: 16,
      padding,
      ...(shadow ? shadows.md : {}),
    } as ViewStyle,
    getVariantStyles(),
    style as ViewStyle,
  ];

  if (onPress) {
    return <AnimatedPressable onPress={onPress} style={cardStyle} scaleTo={0.97}>{children}</AnimatedPressable>;
  }
  return <View style={cardStyle}>{children}</View>;
}
