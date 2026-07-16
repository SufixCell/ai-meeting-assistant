import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../theme';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AnimatedPressable } from '../animated-pressable';

export function FloatingNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  
  // Calculate max width for the floating nav (like max-w-lg in tailwind)
  const MAX_WIDTH = Math.min(width - 48, 500); 
  const TAB_WIDTH = MAX_WIDTH / state.routes.length;

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(state.index * TAB_WIDTH, {
            damping: 20,
            stiffness: 300,
          }),
        },
      ],
    };
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View 
        style={[
          styles.navContainer, 
          { 
            width: MAX_WIDTH, 
            backgroundColor: theme.name === 'arctic' ? '#FFFFFF' : '#171717', // dark:bg-neutral-900 
            borderColor: theme.name === 'arctic' ? '#E5E7EB' : '#262626' // border-gray-200 / border-gray-800
          }
        ]}
      >
        {/* Sliding Active Indicator */}
        <Animated.View
          style={[
            styles.indicator,
            { 
              width: TAB_WIDTH - 12,
              backgroundColor: theme.name === 'arctic' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.2)', // bg-blue-500/10
            },
            animatedIndicatorStyle,
          ]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

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
              style={styles.navItem}
              scaleTo={0.9}
            >
              <View style={{ zIndex: 10 }}>
                {Icon && (
                  <Icon 
                    focused={isFocused} 
                    color={isFocused ? (theme.name === 'arctic' ? '#3B82F6' : '#60A5FA') : (theme.name === 'arctic' ? '#4B5563' : '#D1D5DB')} 
                    size={22} 
                  />
                )}
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
    justifyContent: 'space-between',
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 10,
  },
  indicator: {
    position: 'absolute',
    height: 48,
    borderRadius: 24,
    left: 6,
    zIndex: 0,
  },
});
