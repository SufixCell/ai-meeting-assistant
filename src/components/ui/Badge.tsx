import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Mic, Video, Hash, Cpu } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

export type BadgeSource = 'mic' | 'zoom' | 'meet' | 'teams' | 'discord' | 'bot';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  source: BadgeSource;
  size?: BadgeSize;
}

export function Badge({ source, size = 'md' }: BadgeProps) {
  const { theme } = useTheme();

  const config: Record<BadgeSource, { color: string; label: string; Icon: any }> = {
    mic: { color: theme.colors.primary, label: 'Mic', Icon: Mic },
    zoom: { color: '#2D8CFF', label: 'Zoom', Icon: Video },
    meet: { color: '#00897B', label: 'Meet', Icon: Video },
    teams: { color: '#5B5EA6', label: 'Teams', Icon: Video },
    discord: { color: '#5865F2', label: 'Discord', Icon: Hash },
    bot: { color: theme.colors.purple, label: 'Bot', Icon: Cpu },
  };

  const { color, label, Icon } = config[source] || config.mic;

  const isSm = size === 'sm';
  const paddingHorizontal = isSm ? 8 : 12;
  const paddingVertical = isSm ? 3 : 5;
  const iconSize = isSm ? 11 : 13;
  const fontSize = isSm ? 11 : 12;
  const gap = isSm ? 4 : 5;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal,
        paddingVertical,
        gap,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: `${color}30`,
        backgroundColor: `${color}15`,
      }}
    >
      <Icon size={iconSize} color={color} />
      <Text style={{ fontSize, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
}
