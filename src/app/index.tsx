import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../theme';
import { Mic, Square, Pause, Play, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay, 
  Easing,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInDown
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
type RecordState = 'idle' | 'recording' | 'paused' | 'processing';

export default function RecordScreen() {
  const [state, setState] = useState<RecordState>('idle');
  const [timer, setTimer] = useState(0);
  const [processingStage, setProcessingStage] = useState(0);
  const router = useRouter();
  const { theme } = useTheme();

  // Breathing Orb Animations
  const glowScale1 = useSharedValue(1);
  const glowScale2 = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (state === 'idle') {
      glowScale1.value = withRepeat(withTiming(1.2, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
      glowScale2.value = withRepeat(withDelay(500, withTiming(1.4, { duration: 2500, easing: Easing.inOut(Easing.ease) })), -1, true);
      glowOpacity.value = withRepeat(withTiming(0.1, { duration: 2500 }), -1, true);
    } else if (state === 'recording') {
      glowScale1.value = withRepeat(withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
      glowScale2.value = withRepeat(withDelay(200, withTiming(1.6, { duration: 800, easing: Easing.inOut(Easing.ease) })), -1, true);
      glowOpacity.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
    } else {
      // Paused or processing
      glowScale1.value = withSpring(1);
      glowScale2.value = withSpring(1);
      glowOpacity.value = withTiming(0.1);
    }
  }, [state]);

  const animatedGlow1 = useAnimatedStyle(() => ({ transform: [{ scale: glowScale1.value }], opacity: glowOpacity.value }));
  const animatedGlow2 = useAnimatedStyle(() => ({ transform: [{ scale: glowScale2.value }], opacity: glowOpacity.value * 0.7 }));

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'recording') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  // Processing Simulation Logic
  useEffect(() => {
    if (state === 'processing') {
      let stage = 0;
      const interval = setInterval(() => {
        stage++;
        if (stage > 4) {
          clearInterval(interval);
          router.push('/summary');
          setTimeout(() => { setState('idle'); setTimer(0); setProcessingStage(0); }, 500);
        } else {
          setProcessingStage(stage);
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [state]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const processingStages = [
    "Uploading audio...",
    "Generating transcript...",
    "Extracting decisions...",
    "Finding action items...",
    "Building executive summary..."
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Soft Top Gradient */}
      <LinearGradient
        colors={[theme.colors.primaryGlow, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />

      {/* Header Area */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.colors.textMuted }]}>
          {state === 'idle' ? 'Good Morning' : 'AI Meeting Assistant'}
        </Text>
        {state === 'idle' && (
          <Text style={[styles.headline, { color: theme.colors.text }]}>
            Ready to capture your next meeting?
          </Text>
        )}
      </View>

      {/* Main Orb / Recording UI */}
      <View style={styles.centerStage}>
        {state === 'idle' && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.idleState}>
            <View style={styles.orbContainer}>
              <Animated.View style={[styles.pulseRing, animatedGlow1, { backgroundColor: theme.colors.primary }]} />
              <Animated.View style={[styles.pulseRing, animatedGlow2, { backgroundColor: theme.colors.primary }]} />
              
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => setState('recording')}
                style={[styles.mainOrb, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} 
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.purple]}
                  style={styles.innerOrbGradient}
                >
                  <Mic size={48} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={[styles.tapToRecord, { color: theme.colors.text }]}>Tap to Record</Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              Record once. We'll generate transcripts, summaries, action items, and searchable notes automatically.
            </Text>
          </Animated.View>
        )}

        {(state === 'recording' || state === 'paused') && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.recordingState}>
            <View style={styles.orbContainer}>
              <Animated.View style={[styles.pulseRing, animatedGlow1, { backgroundColor: theme.colors.danger }]} />
              <Animated.View style={[styles.pulseRing, animatedGlow2, { backgroundColor: theme.colors.danger }]} />
              
              <View style={[styles.liveOrb, { backgroundColor: theme.colors.surface, borderColor: theme.colors.danger }]}>
                <Waveform active={state === 'recording'} theme={theme} />
              </View>
            </View>
            
            <View style={styles.statusIndicator}>
              <View style={[styles.liveDot, { backgroundColor: state === 'recording' ? theme.colors.danger : theme.colors.textMuted }]} />
              <Text style={[styles.timer, { color: theme.colors.text }]}>{formatTime(timer)}</Text>
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity 
                style={[styles.controlButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]} 
                onPress={() => setState(state === 'recording' ? 'paused' : 'recording')}
              >
                {state === 'recording' ? <Pause size={24} color={theme.colors.text} /> : <Play size={24} color={theme.colors.text} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.controlButton, styles.stopButton, { backgroundColor: theme.colors.danger }]} 
                onPress={() => setState('processing')}
              >
                <Square size={24} color="#FFFFFF" fill="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {state === 'processing' && (
          <Animated.View entering={FadeIn.delay(300)} exiting={FadeOut} style={styles.processingState}>
            <View style={[styles.aiPulseContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
               <Sparkles size={40} color={theme.colors.primary} />
               <Loader2 size={80} color={theme.colors.primaryGlow} style={styles.spinnerIcon} />
            </View>
            <Text style={[styles.processingTitle, { color: theme.colors.text }]}>AI is working...</Text>
            <Animated.Text entering={SlideInDown} key={processingStage} style={[styles.processingStageText, { color: theme.colors.primary }]}>
              {processingStages[processingStage] || processingStages[processingStages.length - 1]}
            </Animated.Text>
            
            {/* Shimmer Skeletons */}
            <View style={styles.skeletonContainer}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceHighlight, width: '90%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceHighlight, width: '70%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceHighlight, width: '80%' }]} />
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// Minimal simulated Waveform
const Waveform = ({ active, theme }: any) => {
  const bars = Array.from({ length: 15 }).map((_, i) => <WaveBar key={i} active={active} delay={i * 120} theme={theme} />);
  return <View style={styles.waveformContainer}>{bars}</View>;
};

const WaveBar = ({ active, delay, theme }: any) => {
  const height = useSharedValue(4);
  useEffect(() => {
    if (active) {
      height.value = withRepeat(withDelay(delay % 400, withTiming(Math.random() * 40 + 10, { duration: 350 })), -1, true);
    } else {
      height.value = withTiming(4, { duration: 300 });
    }
  }, [active]);
  const style = useAnimatedStyle(() => ({ height: height.value }));
  return <Animated.View style={[style, { width: 6, backgroundColor: theme.colors.danger, borderRadius: 3 }]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // accommodate tab bar
  },
  idleState: {
    alignItems: 'center',
    width: '100%',
  },
  recordingState: {
    alignItems: 'center',
    width: '100%',
  },
  processingState: {
    alignItems: 'center',
    width: '100%',
  },
  orbContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  pulseRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  mainOrb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  innerOrbGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  tapToRecord: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    gap: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timer: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stopButton: {
    borderWidth: 0,
    elevation: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  aiPulseContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  spinnerIcon: {
    position: 'absolute',
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  processingStageText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 40,
  },
  skeletonContainer: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});
