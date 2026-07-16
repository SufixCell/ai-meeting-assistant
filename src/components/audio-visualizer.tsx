import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  Easing
} from 'react-native-reanimated';
import { useTheme } from '../theme';

interface AudioVisualizerProps {
  isRecording: boolean;
}

const BARS_COUNT = 15;

export function AudioVisualizer({ isRecording }: AudioVisualizerProps) {
  const { theme } = useTheme();
  
  // Generate an array of shared values for each bar
  const heights = Array.from({ length: BARS_COUNT }).map(() => useSharedValue(4));

  useEffect(() => {
    if (isRecording) {
      heights.forEach((height, i) => {
        const animate = () => {
          // Generate a random height between 10 and 60
          const randomHeight = Math.random() * 50 + 10;
          // Random duration between 150ms and 350ms
          const randomDuration = Math.random() * 200 + 150;
          
          height.value = withTiming(randomHeight, { duration: randomDuration }, () => {
            // Recursive call for continuous random animation, 
            // handled by reanimated on the UI thread, but we trigger from JS
          });
        };
        
        // Instead of complex recursion, let's use withRepeat and withSequence for simplicity
        // We'll create a continuously repeating sequence of random heights.
        // Actually, the best way to get truly random looking continuous movement 
        // is a setInterval that updates the shared value to a new random target.
      });

      const interval = setInterval(() => {
        heights.forEach(height => {
          const randomHeight = Math.random() * 50 + 10;
          height.value = withTiming(randomHeight, { 
            duration: 150,
            easing: Easing.inOut(Easing.ease) 
          });
        });
      }, 150);

      return () => {
        clearInterval(interval);
        // Reset heights to flat when stopped
        heights.forEach(height => {
          height.value = withTiming(4, { duration: 300 });
        });
      };
    } else {
      // Reset to 4px if not recording
      heights.forEach(height => {
        height.value = withTiming(4, { duration: 300 });
      });
    }
  }, [isRecording]);

  return (
    <View style={styles.container}>
      {heights.map((height, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          return {
            height: height.value,
          };
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              { backgroundColor: theme.colors.primary },
              animatedStyle,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    gap: 6,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    // backgroundColor is dynamically set
  },
});
