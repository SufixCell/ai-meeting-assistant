import React from 'react';
import { View, StyleSheet, Image, Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import { DEFAULT_AVATAR } from '../constants/avatars';

interface ThemeAvatarProps {
  url?: string | null;
  size?: number;
  showBorder?: boolean;
  style?: any;
  onPress?: () => void;
}

export function ThemeAvatar({
  url,
  size = 40,
  showBorder = true,
  style,
  onPress,
}: ThemeAvatarProps) {
  const { theme } = useTheme();

  const avatarUrl = url || DEFAULT_AVATAR;

  // Theme-specific styling for the line-art avatars:
  // In Midnight & Executive (dark themes), invert the image lines so black line-art becomes bright light line-art
  const getContainerStyle = () => {
    if (theme.name === 'midnight') {
      return {
        backgroundColor: '#141424',
        borderColor: theme.colors.primary,
      };
    } else if (theme.name === 'executive') {
      return {
        backgroundColor: '#1E1E1E',
        borderColor: theme.colors.accent,
      };
    }
    // Arctic / Light theme
    return {
      backgroundColor: '#F1F5F9',
      borderColor: theme.colors.border,
    };
  };

  const getWebFilter = () => {
    if (Platform.OS !== 'web') return {};
    if (theme.name === 'midnight') {
      return { filter: 'invert(0.92) contrast(1.1) brightness(1.2)' } as any;
    } else if (theme.name === 'executive') {
      return { filter: 'invert(0.85) sepia(0.8) hue-rotate(15deg) contrast(1.1)' } as any;
    }
    // Arctic (light): keep crisp black line art
    return { filter: 'multiply' } as any;
  };

  const themeStyle = getContainerStyle();

  const avatarContent = (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: showBorder ? 1.5 : 0,
          backgroundColor: themeStyle.backgroundColor,
          borderColor: themeStyle.borderColor,
        },
        style,
      ]}
    >
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.image,
          {
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: (size * 0.85) / 2,
          },
          getWebFilter(),
        ]}
        resizeMode="contain"
      />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {avatarContent}
      </TouchableOpacity>
    );
  }

  return avatarContent;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    alignSelf: 'center',
  },
});
