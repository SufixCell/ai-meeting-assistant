import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useBotSession } from '../contexts/BotSessionContext';
import { useTheme } from '../theme';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Video, Hash, Cpu } from 'lucide-react-native';

export function BotStatusCard() {
  const { session, disconnectBot } = useBotSession();
  const { theme } = useTheme();
  const [timer, setTimer] = useState(0);

  const pulseOpacity = useSharedValue(0.2);

  useEffect(() => {
    if (session?.status === 'in_call') {
      pulseOpacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    } else {
      pulseOpacity.value = 1;
    }
  }, [session?.status]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  useEffect(() => {
    let interval: any;
    if (session?.startedAt && (session.status === 'in_call' || session.status === 'joining' || session.status === 'disconnecting')) {
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - session.startedAt!) / 1000));
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [session?.startedAt, session?.status]);

  if (!session || session.status === 'idle') return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPlatformIcon = () => {
    if (session.platform === 'discord') return <Hash size={16} color={theme.colors.textMuted} style={{ marginRight: 6 }} />;
    if (session.platform === 'zoom' || session.platform === 'meet' || session.platform === 'teams') return <Video size={16} color={theme.colors.textMuted} style={{ marginRight: 6 }} />;
    return <Cpu size={16} color={theme.colors.textMuted} style={{ marginRight: 6 }} />;
  };

  const getStatusPill = () => {
    switch (session.status) {
      case 'joining':
        return { bg: '#F59E0B18', text: '#F59E0B', label: 'Joining…' };
      case 'in_call':
        return { bg: '#10B98118', text: '#10B981', label: 'In Call' };
      case 'processing':
        return { bg: `${theme.colors.primary}18`, text: theme.colors.primary, label: 'Processing…' };
      case 'disconnecting':
        return { bg: `${theme.colors.primary}18`, text: theme.colors.primary, label: 'Ending…' };
      default:
        return { bg: theme.colors.surfaceHighlight, text: theme.colors.textMuted, label: 'Unknown' };
    }
  };

  const pill = getStatusPill();
  const showEndButton = session.status === 'joining' || session.status === 'in_call';
  const dotColor = session.status === 'in_call' ? theme.colors.danger : session.status === 'joining' ? theme.colors.warning : theme.colors.textMuted;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.row}>
        <Animated.View style={[styles.dot, pulseStyle, { backgroundColor: dotColor }]} />
        {getPlatformIcon()}
        <Text style={[styles.label, { color: theme.colors.text }]} numberOfLines={1}>
          {session.label || 'Meeting in progress'}
        </Text>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.pillText, { color: pill.text }]}>{pill.label}</Text>
        </View>
        <Text style={[styles.timer, { color: theme.colors.textMuted }]}>
          {formatTime(timer)}
        </Text>
      </View>
      {showEndButton && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.endButton, { borderColor: theme.colors.danger }]}
            onPress={disconnectBot}
          >
            <Text style={[styles.endButtonText, { color: theme.colors.danger }]}>End Meeting</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timer: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  endButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  endButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
