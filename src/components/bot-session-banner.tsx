import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { AnimatedPressable } from './animated-pressable';
import { useBotSession, BotPlatform } from '../contexts/BotSessionContext';
import { PhoneOff, Video, Hash, Loader } from 'lucide-react-native';

// ─── Format elapsed time ──────────────────────────────────────────────────────

function useElapsed(startedAt: number | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Platform icon ────────────────────────────────────────────────────────────

function PlatformIcon({ platform, color, size = 16 }: { platform: BotPlatform; color: string; size?: number }) {
  if (platform === 'discord') return <Hash size={size} color={color} />;
  return <Video size={size} color={color} />;
}

// ─── Status label ─────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  joining: 'Joining…',
  in_call: 'In call',
  disconnect_requested: 'Disconnect requested',
  disconnecting: 'Disconnecting…',
  processing: 'Processing…',
  idle: '',
};

// ─── Bot Session Banner ───────────────────────────────────────────────────────

export function BotSessionBanner() {
  const { theme } = useTheme();
  const { session, disconnectBot, clearError } = useBotSession();
  const pathname = require('expo-router').usePathname();
  const elapsed = useElapsed(session?.startedAt ?? null);
  const isDark = theme.name !== 'arctic';

  // Pulse animation for the live dot
  const dotOpacity = useSharedValue(1);
  useEffect(() => {
    if (session?.status === 'in_call') {
      dotOpacity.value = withRepeat(withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      dotOpacity.value = 1;
    }
  }, [session?.status]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  // Spinner rotation for joining / processing
  const rotation = useSharedValue(0);
  useEffect(() => {
    const spinning = session?.status === 'joining' || session?.status === 'processing' || session?.status === 'disconnecting';
    if (spinning) {
      rotation.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false);
    } else {
      rotation.value = 0;
    }
  }, [session?.status]);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  if (!session || session.status === 'idle') {
    // Show error banner briefly if session had an error but is now cleared
    return null;
  }

  if (pathname === '/' && (session.status === 'in_call' || session.status === 'joining')) {
    // Hide the small banner on the home screen because we have the giant full-screen Bot UI there!
    return null;
  }

  const isActive = session.status === 'in_call';
  const isProcessing = session.status === 'processing' || session.status === 'disconnecting';
  const statusColor = isActive ? '#10B981' : isProcessing ? theme.colors.primary : theme.colors.textMuted;
  const label = STATUS_LABELS[session.status];

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(22).stiffness(180)}
      exiting={SlideOutDown.duration(250)}
      style={styles.bannerWrapper}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={isDark ? 60 : 85}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.banner, { borderColor: theme.colors.border }]}
      >
        {/* Left: platform icon + status */}
        <View style={styles.left}>
          <View style={[styles.platformIconWrapper, { backgroundColor: theme.colors.primary + '22' }]}>
            <PlatformIcon platform={session.platform} color={theme.colors.primary} size={15} />
          </View>

          <View>
            <Text style={[styles.sessionLabel, { color: theme.colors.text }]} numberOfLines={1}>
              {session.label}
            </Text>

            <View style={styles.statusRow}>
              {isActive && (
                <Animated.View style={[styles.liveDot, { backgroundColor: '#10B981' }, dotStyle]} />
              )}
              {(isProcessing) && (
                <Animated.View style={spinStyle}>
                  <Loader size={12} color={theme.colors.primary} />
                </Animated.View>
              )}
              <Text style={[styles.statusText, { color: statusColor }]}>{label}</Text>
              {isActive && (
                <Text style={[styles.elapsed, { color: theme.colors.textMuted }]}>{elapsed}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Right: disconnect button */}
        {(isActive || session.status === 'joining') && (
          <AnimatedPressable
            onPress={disconnectBot}
            scaleTo={0.88}
            style={[styles.disconnectBtn, { backgroundColor: theme.colors.danger + '22', borderColor: theme.colors.danger + '55' }]}
          >
            <PhoneOff size={15} color={theme.colors.danger} />
            <Text style={[styles.disconnectText, { color: theme.colors.danger }]}>End</Text>
          </AnimatedPressable>
        )}
      </BlurView>

      {/* Error sub-banner */}
      {session.error && (
        <Animated.View entering={FadeIn} style={[styles.errorBanner, { backgroundColor: theme.colors.danger + '20' }]}>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{session.error}</Text>
          <AnimatedPressable onPress={clearError} scaleTo={0.9}>
            <Text style={[styles.errorDismiss, { color: theme.colors.danger }]}>Dismiss</Text>
          </AnimatedPressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 16,
    right: 16,
    zIndex: 999,
    gap: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  platformIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  elapsed: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 12,
  },
  disconnectText: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  errorDismiss: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
  },
});
