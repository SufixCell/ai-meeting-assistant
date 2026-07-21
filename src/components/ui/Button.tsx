import React from 'react';
import { ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { AnimatedPressable } from '../animated-pressable';
import { Text } from './Text';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  size = 'md',
  style,
}: ButtonProps) {
  const { theme } = useTheme();

  let height = 48;
  let fontSize = 15;
  if (size === 'sm') {
    height = 36;
    fontSize = 14;
  } else if (size === 'lg') {
    height = 56;
    fontSize = 16;
  }

  const baseStyle: ViewStyle = {
    height,
    borderRadius: height / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    opacity: disabled ? 0.5 : 1,
    gap: 8,
  };

  let contentColor = theme.colors.text;
  let bgColor = theme.colors.surfaceHighlight;

  if (variant === 'primary') {
    contentColor = theme.colors.onPrimary;
  } else if (variant === 'danger') {
    contentColor = theme.colors.danger;
    bgColor = 'transparent';
  } else if (variant === 'ghost') {
    bgColor = 'transparent';
  }

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={contentColor} size="small" />
      ) : icon ? (
        icon
      ) : null}
      <Text style={{ color: contentColor, fontSize, fontWeight: '600' }}>
        {label}
      </Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled || loading}
        scaleTo={0.95}
        style={[style, { borderRadius: height / 2, overflow: 'hidden', opacity: disabled ? 0.5 : 1 }]}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[baseStyle, { opacity: 1, width: '100%' }]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.95}
      style={[baseStyle, { backgroundColor: bgColor }, style]}
    >
      {content}
    </AnimatedPressable>
  );
}
