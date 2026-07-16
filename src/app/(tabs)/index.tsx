import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { Mic, Square, Pause, Play, Sparkles, FileText, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { AudioVisualizer } from '../../components/audio-visualizer';
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
  SlideInDown,
} from 'react-native-reanimated';
import { AnimatedPressable } from '../../components/animated-pressable';

const { width } = Dimensions.get('window');
type RecordState = 'idle' | 'recording' | 'paused' | 'processing';

export default function RecordScreen() {
  const [state, setState] = useState<RecordState>('idle');
  const [timer, setTimer] = useState(0);
  const [processingStage, setProcessingStage] = useState(0);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  // We store live transcript in a ref so the speech API callback always reads current value
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const transcriptRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const recognitionActiveRef = useRef(false);
  const shouldBeRecordingRef = useRef(false);
  const router = useRouter();
  const { theme } = useTheme();

  // ─── Fetch recent meetings ────────────────────────────────────────────────
  useEffect(() => {
    if (state === 'idle') {
      supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)
        .then(({ data }) => {
          if (data) setRecentMeetings(data);
        });
    }
  }, [state]);

  // ─── Breathing Orb Animations ─────────────────────────────────────────────
  const glowScale1 = useSharedValue(1);
  const glowScale2 = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);

  useEffect(() => {
    if (state === 'idle') {
      glowScale1.value = withRepeat(withTiming(1.2, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
      glowScale2.value = withRepeat(withDelay(500, withTiming(1.4, { duration: 2500, easing: Easing.inOut(Easing.ease) })), -1, true);
      glowOpacity.value = withRepeat(withTiming(0.1, { duration: 2500 }), -1, true);
    } else {
      glowScale1.value = withSpring(1);
      glowScale2.value = withSpring(1);
      glowOpacity.value = withTiming(0.1);
    }
  }, [state]);

  const animatedGlow1 = useAnimatedStyle(() => ({ transform: [{ scale: glowScale1.value }], opacity: glowOpacity.value }));
  const animatedGlow2 = useAnimatedStyle(() => ({ transform: [{ scale: glowScale2.value }], opacity: glowOpacity.value * 0.7 }));

  // ─── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'recording') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  // ─── Web Speech API Setup ─────────────────────────────────────────────────
  const startRecognition = useCallback(() => {
    if (Platform.OS !== 'web') return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn('SpeechRecognition not supported in this browser');
      return;
    }

    // Always create a fresh instance to avoid state issues
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          transcriptRef.current += result[0].transcript + ' ';
          setDisplayTranscript(transcriptRef.current);
          setInterimText('');
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) setInterimText(interim);
    };

    rec.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error);
      recognitionActiveRef.current = false;
      // Auto-restart on network errors
      if (e.error === 'network' || e.error === 'no-speech') {
        if (shouldBeRecordingRef.current) {
          setTimeout(() => {
            if (shouldBeRecordingRef.current) startRecognition();
          }, 500);
        }
      }
    };

    rec.onend = () => {
      recognitionActiveRef.current = false;
      // Chrome stops recognition automatically — restart if we still should be recording
      if (shouldBeRecordingRef.current) {
        setTimeout(() => {
          if (shouldBeRecordingRef.current) startRecognition();
        }, 100);
      }
    };

    rec.onstart = () => {
      recognitionActiveRef.current = true;
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, []);

  const stopRecognition = useCallback(() => {
    shouldBeRecordingRef.current = false;
    recognitionActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  // ─── Recording State Machine ──────────────────────────────────────────────
  const handleStartRecording = () => {
    transcriptRef.current = '';
    setDisplayTranscript('');
    setInterimText('');
    setTimer(0);
    setState('recording');
    shouldBeRecordingRef.current = true;
    startRecognition();
  };

  const handlePause = () => {
    if (state === 'recording') {
      shouldBeRecordingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setState('paused');
    } else if (state === 'paused') {
      setState('recording');
      shouldBeRecordingRef.current = true;
      startRecognition();
    }
  };

  const handleStop = () => {
    stopRecognition();
    setState('processing');
  };

  // ─── AI Processing ────────────────────────────────────────────────────────
  const processingStages = [
    'Uploading audio...',
    'Generating transcript...',
    'Extracting decisions...',
    'Finding action items...',
    'Building executive summary...',
  ];

  useEffect(() => {
    if (state === 'processing') {
      setProcessingStage(0);
      let stage = 0;
      const interval = setInterval(() => {
        stage++;
        if (stage < processingStages.length) {
          setProcessingStage(stage);
        }
      }, 1000);

      // Wait a moment to let final speech results arrive then call Groq
      const groqTimer = setTimeout(async () => {
        clearInterval(interval);
        const finalTranscript = transcriptRef.current.trim();

        // Navigate to summary — pass the transcript, Groq processes on that screen
        router.push({
          pathname: '/summary',
          params: { transcript: finalTranscript },
        });

        setTimeout(() => {
          setState('idle');
          setTimer(0);
          setProcessingStage(0);
          setDisplayTranscript('');
          setInterimText('');
        }, 500);
      }, Math.min(processingStages.length * 1000, 5000));

      return () => {
        clearInterval(interval);
        clearTimeout(groqTimer);
      };
    }
  }, [state]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primaryGlow, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />

      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.colors.textMuted }]}>
          {state === 'idle' ? 'AI Meeting Assistant' : 'Recording'}
        </Text>
        {state === 'idle' && (
          <Text style={[styles.headline, { color: theme.colors.text }]}>
            Ready to capture your next meeting?
          </Text>
        )}
      </View>

      <View style={styles.centerStage}>
        {/* ── IDLE ── */}
        {state === 'idle' && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.idleState}>
            <View style={styles.orbContainer}>
              <Animated.View style={[styles.pulseRing, animatedGlow1, { backgroundColor: theme.colors.primary }]} />
              <Animated.View style={[styles.pulseRing, animatedGlow2, { backgroundColor: theme.colors.primary }]} />

              <AnimatedPressable
                onPress={handleStartRecording}
                style={[styles.mainOrb, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                scaleTo={0.88}
              >
                <LinearGradient colors={[theme.colors.primary, theme.colors.purple]} style={styles.innerOrbGradient}>
                  <Mic size={48} color="#FFFFFF" />
                </LinearGradient>
              </AnimatedPressable>
            </View>
            <Text style={[styles.tapToRecord, { color: theme.colors.text }]}>Tap to Record</Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              Record your meeting. AI will generate a transcript, summary, and action items automatically.
            </Text>
          </Animated.View>
        )}

        {/* ── RECORDING / PAUSED ── */}
        {(state === 'recording' || state === 'paused') && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.recordingState}>
            <AudioVisualizer isRecording={state === 'recording'} />

            <View style={styles.statusIndicator}>
              <View style={[styles.liveDot, { backgroundColor: state === 'recording' ? theme.colors.danger : theme.colors.textMuted }]} />
              <Text style={[styles.timer, { color: theme.colors.text }]}>{formatTime(timer)}</Text>
              {state === 'recording' && (
                <Text style={[styles.liveLabel, { color: theme.colors.danger }]}>LIVE</Text>
              )}
            </View>

            <View style={styles.controlsRow}>
              <AnimatedPressable
                style={[styles.controlButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}
                onPress={handlePause}
                scaleTo={0.85}
              >
                {state === 'recording' ? <Pause size={24} color={theme.colors.text} /> : <Play size={24} color={theme.colors.text} />}
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.controlButton, styles.stopButton, { backgroundColor: theme.colors.danger }]}
                onPress={handleStop}
                scaleTo={0.85}
              >
                <Square size={24} color="#FFFFFF" fill="#FFFFFF" />
              </AnimatedPressable>
            </View>

            {/* Live Transcript */}
            <ScrollView
              style={[styles.liveTranscriptContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.liveTranscriptTitle, { color: theme.colors.primary }]}>
                {Platform.OS === 'web' ? '🎤 LIVE TRANSCRIPT' : 'TRANSCRIPT'}
              </Text>
              {displayTranscript || interimText ? (
                <Text style={[styles.liveTranscriptText, { color: theme.colors.text }]}>
                  {displayTranscript}
                  {interimText ? (
                    <Text style={{ color: theme.colors.textMuted, fontStyle: 'italic' }}>{interimText}</Text>
                  ) : null}
                </Text>
              ) : (
                <Text style={[styles.liveTranscriptPlaceholder, { color: theme.colors.textMuted }]}>
                  {state === 'recording'
                    ? Platform.OS === 'web'
                      ? 'Listening... Start speaking.'
                      : 'Recording audio...'
                    : 'Paused'}
                </Text>
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── PROCESSING ── */}
        {state === 'processing' && (
          <Animated.View entering={FadeIn.delay(300)} exiting={FadeOut} style={styles.processingState}>
            <View style={[styles.aiPulseContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Sparkles size={40} color={theme.colors.primary} />
            </View>
            <Text style={[styles.processingTitle, { color: theme.colors.text }]}>AI is working...</Text>
            <Animated.Text entering={SlideInDown} key={processingStage} style={[styles.processingStageText, { color: theme.colors.primary }]}>
              {processingStages[processingStage]}
            </Animated.Text>
            <View style={styles.skeletonContainer}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceHighlight, width: '90%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceHighlight, width: '70%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceHighlight, width: '80%' }]} />
            </View>
          </Animated.View>
        )}
      </View>

      {/* Recent Meetings */}
      {state === 'idle' && recentMeetings.length > 0 && (
        <Animated.View entering={FadeIn.delay(200)} style={styles.recentSection}>
          <Text style={[styles.recentTitle, { color: theme.colors.text }]}>Recent Meetings</Text>
          <ScrollView style={styles.recentList} showsVerticalScrollIndicator={false}>
            {recentMeetings.map(meeting => (
              <AnimatedPressable
                key={meeting.id}
                style={[styles.meetingCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => router.push({ pathname: '/summary', params: { meetingId: meeting.id } })}
                scaleTo={0.97}
              >
                <View style={[styles.meetingIconWrapper, { backgroundColor: theme.colors.surfaceHighlight }]}>
                  <FileText size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.meetingInfo}>
                  <Text style={[styles.meetingTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {meeting.title || 'Meeting'}
                  </Text>
                  <Text style={[styles.meetingDate, { color: theme.colors.textMuted }]}>
                    {new Date(meeting.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.colors.textMuted} />
              </AnimatedPressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 16,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -1.2,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleState: { alignItems: 'center', width: '100%' },
  recordingState: { alignItems: 'center', width: '100%' },
  processingState: { alignItems: 'center', width: '100%' },

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
  tapToRecord: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },

  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
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
    letterSpacing: 1,
  },
  liveLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  controlsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 28,
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

  liveTranscriptContainer: {
    width: '100%',
    maxHeight: 200,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  liveTranscriptTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  liveTranscriptText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  liveTranscriptPlaceholder: {
    fontSize: 15,
    fontStyle: 'italic',
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
  processingTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  processingStageText: {
    fontSize: 16,
    fontWeight: '600',
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

  recentSection: {
    marginTop: 'auto',
    paddingBottom: 110,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  recentList: { maxHeight: 200 },
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  meetingIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  meetingInfo: { flex: 1 },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  meetingDate: { fontSize: 13 },
});
