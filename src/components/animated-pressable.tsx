import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from 'react-native-reanimated';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  opacityTo?: number;
  onPressAnimationComplete?: () => void;
}

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({ 
  children, 
  style, 
  scaleTo = 0.97,
  opacityTo = 0.92,
  onPressIn,
  onPressOut,
  onPressAnimationComplete,
  ...rest 
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = (e: any) => {
    scale.value = withTiming(scaleTo, { duration: 100 });
    opacity.value = withTiming(opacityTo, { duration: 100 }, () => {
      if (onPressAnimationComplete) {
        // Trigger the callback once the press-in animation finishes
        // allowing us to connect it seamlessly to page transitions
      }
    });
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    });
    opacity.value = withTiming(1, { duration: 150 });
    if (onPressOut) onPressOut(e);
  };

  return (
    <AnimatedPressableComponent 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressableComponent>
  );
}
