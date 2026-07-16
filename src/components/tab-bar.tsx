import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { AnimatedPressable } from './animated-pressable';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width - 48; // 24 padding on each side

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const TAB_WIDTH = TAB_BAR_WIDTH / state.routes.length;

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(state.index * TAB_WIDTH, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <View style={[styles.tabBarWrapper, { borderColor: theme.colors.border }]}>
        <BlurView 
          intensity={theme.name === 'arctic' ? 80 : 30} 
          tint={theme.name === 'arctic' ? 'light' : 'dark'} 
          style={StyleSheet.absoluteFill} 
        />
        
        <View style={styles.tabBar}>
          <Animated.View
            style={[
              styles.indicator,
              { 
                width: TAB_WIDTH - 16, 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.primary,
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
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tabItem}
                scaleTo={0.85}
              >
                {Icon && (
                  <Icon 
                    focused={isFocused} 
                    color={isFocused ? theme.colors.primary : theme.colors.textMuted} 
                    size={24} 
                  />
                )}
              </AnimatedPressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  tabBarWrapper: {
    width: TAB_BAR_WIDTH,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)', // Base tint for blur
  },
  tabBar: {
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  indicator: {
    position: 'absolute',
    height: 48,
    borderRadius: 24,
    left: 8,
    zIndex: 0,
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
