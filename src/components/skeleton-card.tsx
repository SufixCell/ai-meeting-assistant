import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay } from 'react-native-reanimated';

export interface SkeletonCardProps {
  delay?: number;
  style?: any;
}

export function SkeletonCard({ delay = 0, style }: SkeletonCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animated values for pulsing skeleton rows
  const opacity = useSharedValue(0.4);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    // Staggered delay logic mapped for native compatibility
    opacity.value = withDelay(
      delay * 150,
      withRepeat(withTiming(0.8, { duration: 1500 }), -1, true)
    );
    cardScale.value = withRepeat(
      withTiming(0.99, { duration: 2500 }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const floatStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
    };
  });

  return (
    <Animated.View style={[floatStyle, styles.container, isDark ? styles.containerDark : styles.containerLight, style]}>
      <BlurView
        intensity={isDark ? 40 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardContent}>
        {/* Top Header Placeholder */}
        <View style={styles.topRow}>
          <View style={styles.iconBadgeContainer}>
            {/* Mic Placeholder */}
            <Animated.View style={[pulseStyle, styles.iconPlaceholder, isDark ? styles.bgDark : styles.bgLight]} />
            {/* Status Badge Placeholder */}
            <Animated.View style={[pulseStyle, styles.badgePlaceholder, isDark ? styles.bgDark : styles.bgLight]} />
          </View>
          {/* Menu Placeholder */}
          <View style={[styles.menuPlaceholder, isDark ? styles.bgDark : styles.bgLight]} />
        </View>

        {/* Content Body Placeholder */}
        <View style={styles.contentBody}>
          <Animated.View style={[pulseStyle, styles.titlePlaceholder, isDark ? styles.bgDark : styles.bgLight]} />
          <Animated.View style={[pulseStyle, styles.subtitlePlaceholder, isDark ? styles.bgDark : styles.bgLight]} />
        </View>

        {/* AI Summary Placeholder lines */}
        <View style={styles.summaryContainer}>
          <Animated.View style={[pulseStyle, styles.summaryLine, { width: '95%' }, isDark ? styles.bgDark : styles.bgLight]} />
          <Animated.View style={[pulseStyle, styles.summaryLine, { width: '85%' }, isDark ? styles.bgDark : styles.bgLight]} />
          <Animated.View style={[pulseStyle, styles.summaryLine, { width: '90%' }, isDark ? styles.bgDark : styles.bgLight]} />
          <Animated.View style={[pulseStyle, styles.summaryLine, { width: '60%' }, isDark ? styles.bgDark : styles.bgLight]} />
        </View>

        {/* Metadata Badges Placeholders */}
        <View style={styles.metaRow}>
          <View style={[styles.metaBadge, isDark ? styles.metaBadgeDark : styles.metaBadgeLight]} />
          <View style={[styles.metaBadge, { width: 60 }, isDark ? styles.metaBadgeDark : styles.metaBadgeLight]} />
          <View style={[styles.metaBadge, { width: 70 }, isDark ? styles.metaBadgeDark : styles.metaBadgeLight]} />
        </View>

        {/* Bottom CTA Drawer separator */}
        <View style={[styles.ctaSeparator, isDark ? styles.separatorDark : styles.separatorLight]}>
          <Animated.View style={[pulseStyle, styles.ctaText, isDark ? styles.bgDark : styles.bgLight]} />
          <View style={[styles.chevron, isDark ? styles.bgDark : styles.bgLight]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  containerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  cardContent: {
    padding: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  badgePlaceholder: {
    width: 110,
    height: 22,
    borderRadius: 11,
  },
  menuPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  contentBody: {
    marginBottom: 16,
    gap: 8,
  },
  titlePlaceholder: {
    height: 22,
    width: '65%',
    borderRadius: 6,
  },
  subtitlePlaceholder: {
    height: 14,
    width: '40%',
    borderRadius: 4,
  },
  summaryContainer: {
    marginBottom: 16,
    gap: 6,
  },
  summaryLine: {
    height: 12,
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metaBadge: {
    height: 24,
    width: 80,
    borderRadius: 8,
    borderWidth: 1,
  },
  metaBadgeDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaBadgeLight: {
    backgroundColor: 'rgba(240, 240, 243, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  ctaSeparator: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  separatorDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  separatorLight: {
    borderTopColor: 'rgba(15, 23, 42, 0.06)',
  },
  ctaText: {
    height: 14,
    width: 140,
    borderRadius: 4,
  },
  chevron: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  bgDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bgLight: {
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
});

export default SkeletonCard;
