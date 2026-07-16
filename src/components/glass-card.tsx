import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { GlassCardProps } from './glass-card.types';
import { theme } from '../theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export function GlassCard({
  title,
  subtitle,
  description,
  badgeText,
  badgeType = 'default',
  icon,
  chips = [],
  actionText,
  onPress,
  rightElement,
  metaBadges = [],
  style,
  children,
}: GlassCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(1.02, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  // Badges styles mapping
  const getBadgeStyle = () => {
    if (badgeType === 'success') {
      return [styles.badge, styles.badgeSuccess];
    }
    if (badgeType === 'processing') {
      return [styles.badge, styles.badgeProcessing];
    }
    if (badgeType === 'danger') {
      return [styles.badge, styles.badgeDanger];
    }
    return styles.badge;
  };

  const getBadgeTextStyle = () => {
    if (badgeType === 'success') {
      return [styles.badgeText, styles.badgeTextSuccess];
    }
    if (badgeType === 'processing') {
      return [styles.badgeText, styles.badgeTextProcessing];
    }
    if (badgeType === 'danger') {
      return [styles.badgeText, styles.badgeTextDanger];
    }
    return styles.badgeText;
  };

  const cardContent = (
    <View style={styles.cardContent}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.iconBadgeContainer}>
          {icon && (
            <View style={[styles.iconContainer, isDark ? styles.iconDark : styles.iconLight]}>
              {icon}
            </View>
          )}
          {badgeText && (
            <View style={getBadgeStyle()}>
              {badgeType === 'processing' && <View style={styles.processingDot} />}
              <Text style={getBadgeTextStyle()}>{badgeText}</Text>
            </View>
          )}
        </View>
        {rightElement && (
          <View style={styles.rightElementContainer}>
            {rightElement}
          </View>
        )}
      </View>

      {/* Main Text Content */}
      <View style={styles.contentBody}>
        <Text style={[styles.title, isDark ? styles.textWhite : styles.textDark]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>{subtitle}</Text>
        )}
        {description && (
          <Text style={[styles.description, isDark ? styles.textBodyDark : styles.textBodyLight]} numberOfLines={3}>
            {description}
          </Text>
        )}
      </View>

      {/* Meta badges (duration, calendars, etc) */}
      {metaBadges.length > 0 && (
        <View style={styles.metaRow}>
          {metaBadges.map((badge, idx) => (
            <View key={idx} style={[styles.metaBadge, isDark ? styles.metaBadgeDark : styles.metaBadgeLight]}>
              {badge.icon}
              <Text style={[styles.metaText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                {badge.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Chips Row */}
      {chips.length > 0 && (
        <View style={styles.chipsRow}>
          {chips.map((chip, idx) => (
            <View key={idx} style={[styles.chip, isDark ? styles.chipDark : styles.chipLight]}>
              <Text style={[styles.chipText, isDark ? styles.textIndigoDark : styles.textIndigoLight]}>
                {chip}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* CTA Button */}
      {actionText && (
        <View style={styles.ctaContainer}>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>{actionText}</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </View>
        </View>
      )}

      {/* Custom Children Container */}
      {children && (
        <View style={[styles.childrenContainer, isDark ? styles.childrenContainerDark : styles.childrenContainerLight]}>
          {children}
        </View>
      )}
    </View>
  );

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.container,
          isDark ? styles.containerDark : styles.containerLight,
          pressed && styles.pressed,
        ]}
      >
        <BlurView
          intensity={isDark ? 40 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {cardContent}
      </Pressable>
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
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderColor: 'rgba(255, 255, 255, 0.40)',
  },
  pressed: {
    opacity: 0.95,
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
  rightElementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconLight: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderColor: 'rgba(99, 102, 241, 0.12)',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeProcessing: {
    backgroundColor: 'rgba(91, 95, 255, 0.1)',
    borderColor: 'rgba(91, 95, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  badgeTextSuccess: {
    color: '#10B981',
  },
  badgeTextProcessing: {
    color: '#5B5FFF',
  },
  badgeTextDanger: {
    color: '#EF4444',
  },
  processingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5B5FFF',
  },
  childrenContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  childrenContainerDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  childrenContainerLight: {
    borderTopColor: 'rgba(15, 23, 42, 0.08)',
  },
  contentBody: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  chipLight: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderColor: 'rgba(99, 102, 241, 0.12)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ctaContainer: {
    flexDirection: 'row',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  ctaArrow: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#0F172A',
  },
  textMutedDark: {
    color: '#9CA3AF',
  },
  textMutedLight: {
    color: '#64748B',
  },
  textBodyDark: {
    color: '#D1D5DB',
  },
  textBodyLight: {
    color: '#475569',
  },
  textIndigoDark: {
    color: '#818CF8',
  },
  textIndigoLight: {
    color: '#4F46E5',
  },
});

export default GlassCard;
