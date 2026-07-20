import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../theme';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AnimatedPressable } from '../animated-pressable';

const ROUTE_LABELS: Record<string, string> = {
  index: 'Home',
  history: 'History',
  settings: 'Settings',
};

// Only show these 3 in the nav — summary is hidden
const VISIBLE_ROUTES = ['index', 'history', 'settings'];

export function FloatingNav({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Filter to only visible routes
  const visibleRoutes = state.routes.filter((r: any) => VISIBLE_ROUTES.includes(r.name));
  // Find the visible index (summary tab should not shift the indicator)
  const activeVisibleIndex = visibleRoutes.findIndex((r: any) => r.key === state.routes[state.index]?.key);
  const indicatorIndex = activeVisibleIndex >= 0 ? activeVisibleIndex : 0;

  const TAB_WIDTH = 84; // fixed width per tab
  const NAV_WIDTH = TAB_WIDTH * visibleRoutes.length;
  const isDark = theme.name !== 'arctic';
  const bottomPosition = Math.max(insets.bottom + 12, 20);

  // Indicator: no extra offset — just index * TAB_WIDTH
  // The tab items also start at 0, so they perfectly align
  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(indicatorIndex * TAB_WIDTH, {
          damping: 28,
          stiffness: 260,
          mass: 0.8,
        }),
      },
    ],
  }));

  return (
    <View style={[styles.container, { bottom: bottomPosition }]} pointerEvents="box-none">
      <View
        style={[
          styles.navContainer,
          {
            width: NAV_WIDTH,
            backgroundColor: isDark ? '#171717' : '#FFFFFF',
            borderColor: isDark ? '#2a2a2a' : '#E5E7EB',
          },
        ]}
      >
        {/* Sliding pill — starts at x=0, translates by index * TAB_WIDTH */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: TAB_WIDTH,
              backgroundColor: isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.1)',
            },
            animatedIndicatorStyle,
          ]}
        />

        {visibleRoutes.map((route: any, index: number) => {
          const { options } = descriptors[route.key] as any;
          const isFocused = indicatorIndex === index;
          const label = ROUTE_LABELS[route.name] ?? route.name;
          const activeColor = isDark ? '#60A5FA' : '#3B82F6';
          const inactiveColor = isDark ? '#71717A' : '#6B7280';
          const iconColor = isFocused ? activeColor : inactiveColor;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const Icon = options.tabBarIcon;

          return (
            <AnimatedPressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={[styles.navItem, { width: TAB_WIDTH }]}
              scaleTo={0.88}
            >
              {/* Centered icon + label */}
              <View style={styles.itemInner}>
                {Icon && <Icon focused={isFocused} color={iconColor} size={21} />}
                <Text
                  style={[
                    styles.label,
                    { color: iconColor, fontWeight: isFocused ? '600' : '400' },
                  ]}
                >
                  {label}
                </Text>
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    elevation: 50,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 0,           // starts at 0, translateX does the work
    borderRadius: 24,
    zIndex: 0,
  },
  navItem: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
