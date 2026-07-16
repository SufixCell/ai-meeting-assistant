import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../theme';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AnimatedPressable } from '../animated-pressable';

// Labels to show under each route name
const ROUTE_LABELS: Record<string, string> = {
  index: 'Home',
  history: 'History',
  settings: 'Settings',
};

export function FloatingNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const PILL_PADDING = 8; // paddingHorizontal on the pill container
  const TAB_COUNT = state.routes.length;

  // Pill width: snug around 3 tabs. Each tab will be ~80px wide.
  const TAB_WIDTH = 80;
  const NAV_WIDTH = TAB_WIDTH * TAB_COUNT + PILL_PADDING * 2;

  // The indicator slides to: paddingLeft + (index * TAB_WIDTH)
  const indicatorOffset = PILL_PADDING + state.index * TAB_WIDTH;

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(PILL_PADDING + state.index * TAB_WIDTH, {
          damping: 28,
          stiffness: 260,
          mass: 0.8,
        }),
      },
    ],
  }));

  const isDark = theme.name !== 'arctic';

  return (
    <View style={styles.container} pointerEvents="box-none">
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
        {/* Sliding pill indicator — pixel-perfectly aligned */}
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

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
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
              <View style={styles.itemInner}>
                {Icon && <Icon focused={isFocused} color={iconColor} size={21} />}
                <Text
                  style={[
                    styles.label,
                    {
                      color: iconColor,
                      fontWeight: isFocused ? '600' : '400',
                    },
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
