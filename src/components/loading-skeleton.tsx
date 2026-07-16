import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { SkeletonCard } from './skeleton-card';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

export function LoadingSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      {/* Background Mesh Gradient Orbs */}
      <View style={styles.meshOrb1} />
      <View style={styles.meshOrb2} />

      {/* Header Placeholders */}
      <View style={styles.header}>
        <Animated.View style={[pulseStyle, styles.titlePlaceholder, isDark ? styles.placeholderDark : styles.placeholderLight]} />
        <Animated.View style={[pulseStyle, styles.subtitlePlaceholder, isDark ? styles.placeholderDark : styles.placeholderLight]} />
      </View>

      {/* Search Bar Placeholder */}
      <Animated.View style={[pulseStyle, styles.searchPlaceholder, isDark ? styles.searchDark : styles.searchLight]} />

      {/* Filter Chips Placeholders */}
      <View style={styles.chipsRow}>
        <View style={[styles.chipActive, isDark ? styles.chipActiveDark : styles.chipActiveLight]} />
        <Animated.View style={[pulseStyle, styles.chip, isDark ? styles.searchDark : styles.searchLight]} />
        <Animated.View style={[pulseStyle, styles.chip, { width: 70 }, isDark ? styles.searchDark : styles.searchLight]} />
        <Animated.View style={[pulseStyle, styles.chip, { width: 85 }, isDark ? styles.searchDark : styles.searchLight]} />
      </View>

      {/* Cards List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SkeletonCard delay={0} style={styles.cardSpacing} />
        <SkeletonCard delay={1} style={styles.cardSpacing} />
        <SkeletonCard delay={2} style={styles.cardSpacing} />
      </ScrollView>

      {/* Bottom Pagination Dots */}
      <View style={styles.paginationRow}>
        <View style={styles.dotActive} />
        <View style={[styles.dot, isDark ? styles.dotDark : styles.dotLight]} />
        <View style={[styles.dot, isDark ? styles.dotDark : styles.dotLight]} />
        <View style={[styles.dot, isDark ? styles.dotDark : styles.dotLight]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  bgDark: {
    backgroundColor: '#0D0E12',
  },
  bgLight: {
    backgroundColor: '#F8FAFC',
  },
  meshOrb1: {
    position: 'absolute',
    top: -50,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(124, 58, 237, 0.03)',
    filter: 'blur(90px)',
  },
  meshOrb2: {
    position: 'absolute',
    bottom: 100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(91, 95, 255, 0.03)',
    filter: 'blur(80px)',
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 8,
  },
  titlePlaceholder: {
    height: 32,
    width: 140,
    borderRadius: 8,
  },
  subtitlePlaceholder: {
    height: 14,
    width: 240,
    borderRadius: 4,
  },
  searchPlaceholder: {
    height: 48,
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  searchDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
  },
  searchLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    borderColor: 'rgba(255, 255, 255, 0.40)',
    borderWidth: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 20,
  },
  chipActive: {
    height: 32,
    width: 76,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipActiveDark: {
    backgroundColor: 'rgba(91, 95, 255, 0.08)',
    borderColor: 'rgba(91, 95, 255, 0.15)',
  },
  chipActiveLight: {
    backgroundColor: 'rgba(91, 95, 255, 0.10)',
    borderColor: 'rgba(91, 95, 255, 0.20)',
  },
  chip: {
    height: 32,
    width: 80,
    borderRadius: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Avoid overlapping floating tabs
  },
  cardSpacing: {
    marginBottom: 16,
  },
  placeholderDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  placeholderLight: {
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  paginationRow: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5B5FFF',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dotLight: {
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
});

export default LoadingSkeleton;
