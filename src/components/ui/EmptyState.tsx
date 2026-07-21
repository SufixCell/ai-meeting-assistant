import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export function EmptyState({ icon, title, subtitle, action, style }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }, style]}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}>
        {icon}
      </View>
      <Text variant="h2" style={{ color: theme.colors.text, textAlign: 'center', letterSpacing: -0.5 }}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="body" style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 12, maxWidth: '80%', lineHeight: 22 }}>
          {subtitle}
        </Text>
      )}
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="primary"
          style={{ marginTop: 24 }}
        />
      )}
    </View>
  );
}
