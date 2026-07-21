import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { AnimatedPressable } from '../animated-pressable';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';

// Keep the handler setter for backwards compatibility, even though we don't use it in nav anymore
let _fabHandler: (() => void) | null = null;
export function setFABPressHandler(fn: () => void) {
  _fabHandler = fn;
}

export function FloatingNav({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);

  const getBackgroundColor = () => {
    if (theme.name === 'arctic') return '#FFFFFF';
    if (theme.name === 'executive') return '#141414';
    return '#0D0D12';
  };

  const visibleRoutes = state.routes.filter((route: any) => {
    return route.name !== 'summary';
  });

  const tabWidth = containerWidth > 0 ? containerWidth / visibleRoutes.length : 0;
  const activeIndex = visibleRoutes.findIndex((r: any) => r.key === state.routes[state.index].key);

  const translateX = useDerivedValue(() => {
    return withSpring(activeIndex * tabWidth, {
      damping: 24,
      stiffness: 250,
      mass: 0.8,
    });
  }, [activeIndex, tabWidth]);

  const pillContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  return (
    <View 
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={[styles.container, {
        backgroundColor: getBackgroundColor(),
        borderTopColor: theme.colors.border,
        paddingBottom: insets.bottom,
      }]}
    >
      {/* Sliding Pill Indicator */}
      {containerWidth > 0 && (
        <Animated.View style={[styles.pillContainer, pillContainerStyle]}>
          <View style={[styles.pill, { backgroundColor: `${theme.colors.primary}15` }]} />
        </Animated.View>
      )}

      {/* Tabs */}
      {visibleRoutes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = activeIndex === index;
        const label = options.title || route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            label={label}
            iconRenderer={options.tabBarIcon}
            isFocused={isFocused}
            onPress={onPress}
            theme={theme}
          />
        );
      })}
    </View>
  );
}

function TabItem({ label, iconRenderer, isFocused, onPress, theme }: any) {
  const activeOpacity = useDerivedValue(() => withTiming(isFocused ? 1 : 0, { duration: 250 }), [isFocused]);
  const inactiveOpacity = useDerivedValue(() => withTiming(isFocused ? 0 : 1, { duration: 250 }), [isFocused]);

  const activeStyle = useAnimatedStyle(() => ({ opacity: activeOpacity.value, position: 'absolute' }));
  const inactiveStyle = useAnimatedStyle(() => ({ opacity: inactiveOpacity.value, position: 'absolute' }));

  return (
    <AnimatedPressable style={styles.tabSlot} onPress={onPress} scaleTo={0.92}>
      <View style={styles.crossfadeContainer}>
        {/* Inactive State */}
        <Animated.View style={[styles.crossfadeState, inactiveStyle]}>
          {iconRenderer && iconRenderer({ focused: false, color: theme.colors.textMuted, size: 22 })}
          <Text style={[styles.label, { color: theme.colors.textMuted, fontWeight: '500' }]}>{label}</Text>
        </Animated.View>

        {/* Active State */}
        <Animated.View style={[styles.crossfadeState, activeStyle]}>
          {iconRenderer && iconRenderer({ focused: true, color: theme.colors.primary, size: 22 })}
          <Text style={[styles.label, { color: theme.colors.primary, fontWeight: '600' }]}>{label}</Text>
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
  },
  pillContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: 64,
    height: 48,
    borderRadius: 24,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossfadeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 48,
  },
  crossfadeState: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
});
