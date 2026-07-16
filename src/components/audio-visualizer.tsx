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
  mediaStream?: any;
}

const BARS_COUNT = 15;

export function AudioVisualizer({ isRecording, mediaStream }: AudioVisualizerProps) {
  const { theme } = useTheme();
  
  // Generate an array of shared values for each bar
  const heights = Array.from({ length: BARS_COUNT }).map(() => useSharedValue(4));

  useEffect(() => {
    if (!isRecording) {
      // Reset to 4px if not recording
      heights.forEach(height => {
        height.value = withTiming(4, { duration: 300 });
      });
      return;
    }

    if (isRecording && !mediaStream) {
      // Fallback: fake animation if no stream yet but recording
      const interval = setInterval(() => {
        heights.forEach(height => {
          const randomHeight = Math.random() * 30 + 10;
          height.value = withTiming(randomHeight, { duration: 150 });
        });
      }, 150);
      return () => clearInterval(interval);
    }

    if (isRecording && mediaStream) {
      // Real audio visualizer using Web Audio API
      let audioCtx: any;
      let animationFrame: number;

      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(mediaStream);
        source.connect(analyser);
        analyser.fftSize = 64;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const update = () => {
          if (!isRecording) return;
          analyser.getByteFrequencyData(dataArray);
          
          for (let i = 0; i < BARS_COUNT; i++) {
            // Map bin value (0-255) to height (4-60)
            // The first few bins represent low frequencies.
            const value = dataArray[i];
            const h = 4 + (value / 255) * 56;
            heights[i].value = withTiming(h, { duration: 50 });
          }
          animationFrame = requestAnimationFrame(update);
        };
        update();
      } catch (err) {
        console.error('Audio visualizer error:', err);
      }

      return () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close().catch(() => {});
        }
      };
    }
  }, [isRecording, mediaStream]);

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
