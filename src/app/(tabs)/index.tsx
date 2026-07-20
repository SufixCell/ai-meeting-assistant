import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../../theme';
import { Mic, Square, Pause, Play, Sparkles, FileText, ChevronRight, Video } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { AudioVisualizer } from '../../components/audio-visualizer';
import { JoinCallModal } from '../../components/join-call-modal';
import { AnimatedPressable } from '../../components/animated-pressable';
import { BlurView } from 'expo-blur';
import { io } from 'socket.io-client';
import { useBotSession } from '../../contexts/BotSessionContext';
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


const { width } = Dimensions.get('window');
type RecordState = 'idle' | 'recording' | 'paused' | 'processing';

export default function RecordScreen() {
  const [state, setState] = useState<RecordState>('idle');
  const [timer, setTimer] = useState(0);
  const [processingStage, setProcessingStage] = useState(0);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  // We store live transcript in a ref so the speech API callback always reads current value
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [mediaStream, setMediaStream] = useState<any>(null);
  const transcriptRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const recognitionActiveRef = useRef(false);
  const shouldBeRecordingRef = useRef(false);
  const router = useRouter();
  const { theme } = useTheme();

  // ─── Bot Session & Socket ──────────────────────────────────────────────────
  const { session: botSession, disconnectBot } = useBotSession();
  const [botTranscript, setBotTranscript] = useState('');

  useEffect(() => {
    if (botSession?.status === 'joining' || botSession?.status === 'in_call' || botSession?.status === 'disconnecting') {
      const socket = io('http://localhost:5000');
      
      socket.on('webhook_event', (event) => {
        // Handle MeetingBaaS status change webhook to update UI fast
        if (event?.event === 'bot.status_change' && event?.data?.status) {
          const status = event.data.status.toLowerCase();
          const activeStatuses = ['joined', 'recording', 'in_call', 'in_call_recording', 'in_call_not_recording', 'active'];
          if (activeStatuses.includes(status)) {
             setBotTranscript(prev => prev || 'Listening to meeting audio...');
          }
        }
        
        // MeetingBaaS typically sends 'bot.transcript' or similar events with 'text'
        const text = event?.data?.text || event?.data?.transcript || event?.text || '';
        if (text) {
          setBotTranscript(prev => prev + ' ' + text);
        }
      });
      
      return () => {
        socket.disconnect();
      };
    } else {
      setBotTranscript('');
    }
  }, [botSession?.status]);

  // Derived state to know if WE should show the recording UI (either local or bot)
  const isBotRecording = botSession?.status === 'joining' || botSession?.status === 'in_call' || botSession?.status === 'disconnecting';
  const effectiveState = isBotRecording ? (botSession?.status === 'disconnecting' ? 'processing' : 'recording') : state;
  const isBotUI = isBotRecording;

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
    let interval: any;
    if (state === 'recording') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  // ─── Force Mic Permission ─────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          // Permission granted. We can stop the tracks since we don't need the raw stream
          // Web Speech API will request it again but it will be auto-approved.
          stream.getTracks().forEach(track => track.stop());
        })
        .catch((err) => {
          console.warn('Microphone permission error:', err);
          alert('Microphone access is required. Please allow microphone access in your browser settings or click the microphone icon in the URL bar.');
        });
    }
  }, []);

  // ─── Web Speech API Setup ─────────────────────────────────────────────────
  const startRecognition = useCallback(() => {
    if (Platform.OS !== 'web') return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn('SpeechRecognition not supported in this browser');
      setDisplayTranscript('Browser not supported. Please use Google Chrome or Microsoft Edge for live transcription.');
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
      console.warn('Speech recognition error:', e.error);
      recognitionActiveRef.current = false;
      // We don't restart here because onend will always fire after onerror.
      // Restarting in both places causes an exponential crash loop.
    };

    rec.onend = () => {
      recognitionActiveRef.current = false;
      // Chrome stops recognition automatically — restart if we still should be recording
      if (shouldBeRecordingRef.current) {
        setTimeout(() => {
          if (shouldBeRecordingRef.current && !recognitionActiveRef.current) {
            startRecognition();
          }
        }, 250);
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
    if (mediaStream) {
      mediaStream.getTracks().forEach((track: any) => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  // ─── Recording State Machine ──────────────────────────────────────────────
  const handleStartRecording = () => {
    transcriptRef.current = '';
    setDisplayTranscript('');
    setInterimText('');
    setTimer(0);
    setState('recording');
    shouldBeRecordingRef.current = true;
    
    if (Platform.OS === 'web' && navigator.mediaDevices) {
      const voiceOptimizedConstraints = {
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 },
        }
      };

      navigator.mediaDevices.getUserMedia(voiceOptimizedConstraints)
        .catch(() => navigator.mediaDevices.getUserMedia({ audio: true }))
        .then(stream => {
          setMediaStream(stream);
          startRecognition();
        })
        .catch(err => {
          console.error('Mic error:', err);
          setDisplayTranscript('Microphone access denied. Please grant microphone permission to record.');
        });
    } else {
      startRecognition();
    }
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

  // Dynamic responsive sizing for orb and layout
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isSmallDevice = windowWidth < 360 || windowHeight < 660;
  const isDesktop = windowWidth >= 768;

  const orbSize = isSmallDevice ? 170 : Math.min(windowWidth * 0.45, 210);
  const mainOrbSize = Math.round(orbSize * 0.65);
  const innerOrbSize = Math.round(mainOrbSize * 0.78);
  const micIconSize = isSmallDevice ? 36 : 44;

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primaryGlow, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Platform.OS === 'web' ? 45 : 54,
            paddingBottom: 95, // Position button slightly lower, perfectly balanced above navbar
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: theme.colors.textMuted }]}>
              {effectiveState === 'idle' ? 'AI Meeting Assistant' : isBotUI ? 'Bot Recording' : 'Recording'}
            </Text>
            {effectiveState === 'idle' && (
              <Text style={[styles.headline, { color: theme.colors.text, fontSize: isSmallDevice ? 24 : 32 }]}>
                Ready to capture your next meeting?
              </Text>
            )}
          </View>

          <View style={styles.centerStage}>
            {/* ── IDLE ── */}
            {effectiveState === 'idle' && (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.idleState}>
                <View style={[styles.orbContainer, { width: orbSize, height: orbSize, marginBottom: isSmallDevice ? 20 : 32 }]}>
                  <Animated.View style={[styles.pulseRing, animatedGlow1, { width: orbSize, height: orbSize, borderRadius: orbSize / 2, backgroundColor: theme.colors.primary }]} />
                  <Animated.View style={[styles.pulseRing, animatedGlow2, { width: orbSize, height: orbSize, borderRadius: orbSize / 2, backgroundColor: theme.colors.primary }]} />

                  <AnimatedPressable
                    onPress={handleStartRecording}
                    style={[
                      styles.mainOrb,
                      {
                        width: mainOrbSize,
                        height: mainOrbSize,
                        borderRadius: mainOrbSize / 2,
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    scaleTo={0.88}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.purple]}
                      style={[
                        styles.innerOrbGradient,
                        {
                          width: innerOrbSize,
                          height: innerOrbSize,
                          borderRadius: innerOrbSize / 2,
                        },
                      ]}
                    >
                      <Mic size={micIconSize} color="#FFFFFF" />
                    </LinearGradient>
                  </AnimatedPressable>
                </View>
                <Text style={[styles.tapToRecord, { color: theme.colors.text }]}>Tap to Record</Text>
                <Text style={[styles.description, { color: theme.colors.textMuted }]}>
                  Record your meeting. AI will generate a transcript, summary, and action items automatically.
                </Text>

                {/* Join a Meeting button */}
                <AnimatedPressable
                  onPress={() => setJoinModalVisible(true)}
                  scaleTo={0.95}
                  style={[
                    styles.joinCallButton,
                    {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                      width: isDesktop ? 360 : '100%',
                    },
                  ]}
                >
                  <View style={[styles.joinCallIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Video size={18} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.joinCallText, { color: '#FFFFFF' }]}>Join Online Meeting</Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </AnimatedPressable>
              </Animated.View>
            )}

            {/* ── RECORDING / PAUSED ── */}
            {(effectiveState === 'recording' || effectiveState === 'paused') && (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.recordingState}>
                <AudioVisualizer isRecording={effectiveState === 'recording'} mediaStream={mediaStream} />

                <View style={styles.statusIndicator}>
                  <View style={[styles.liveDot, { backgroundColor: effectiveState === 'recording' ? theme.colors.danger : theme.colors.textMuted }]} />
                  <Text style={[styles.timer, { color: theme.colors.text }]}>
                    {isBotUI ? 'BOT IN CALL' : formatTime(timer)}
                  </Text>
                  {effectiveState === 'recording' && (
                    <Text style={[styles.liveLabel, { color: theme.colors.danger }]}>LIVE</Text>
                  )}
                </View>

                <View style={styles.controlsRow}>
                  {!isBotUI && (
                    <AnimatedPressable
                      style={[styles.controlButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}
                      onPress={handlePause}
                      scaleTo={0.85}
                    >
                      {effectiveState === 'recording' ? <Pause size={24} color={theme.colors.text} /> : <Play size={24} color={theme.colors.text} />}
                    </AnimatedPressable>
                  )}
                  <AnimatedPressable
                    style={[styles.controlButton, styles.stopButton, { backgroundColor: theme.colors.danger }]}
                    onPress={isBotUI ? () => disconnectBot() : handleStop}
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
                    {isBotUI ? 'LIVE TRANSCRIPT (BOT)' : Platform.OS === 'web' ? 'LIVE TRANSCRIPT' : 'TRANSCRIPT'}
                  </Text>
                  {isBotUI ? (
                    botTranscript ? (
                      <Text style={[styles.liveTranscriptText, { color: theme.colors.text }]}>
                        {botTranscript}
                      </Text>
                    ) : (
                      <Text style={[styles.liveTranscriptPlaceholder, { color: theme.colors.textMuted }]}>
                        {botSession?.status === 'joining' 
                          ? 'Launching bot and connecting to Google Meet...' 
                          : botSession?.status === 'waiting_for_admission'
                            ? 'Waiting for host approval... Please click Admit in Google Meet.'
                            : botSession?.status === 'connected'
                              ? 'Admitted! Initializing audio capture & speech transcription...'
                              : botSession?.status === 'transcribing'
                                ? 'Listening to meeting audio... Live transcription active.'
                                : botSession?.status === 'generating_summary'
                                  ? 'Generating AI meeting summary and action items...'
                                  : botSession?.status === 'disconnecting' 
                                    ? 'Bot is leaving the meeting...' 
                                    : 'Recording in progress — transcript will be ready shortly after the call ends'}
                      </Text>
                    )
                  ) : (displayTranscript || interimText) ? (
                    <Text style={[styles.liveTranscriptText, { color: theme.colors.text }]}>
                      {displayTranscript}
                      {interimText ? (
                        <Text style={{ color: theme.colors.textMuted, fontStyle: 'italic' }}>{interimText}</Text>
                      ) : null}
                    </Text>
                  ) : (
                    <Text style={[styles.liveTranscriptPlaceholder, { color: theme.colors.textMuted }]}>
                      {effectiveState === 'recording'
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
            {effectiveState === 'processing' && (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.processingState}>
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
          {effectiveState === 'idle' && recentMeetings.length > 0 && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.recentSection}>
              <Text style={[styles.recentTitle, { color: theme.colors.text }]}>Recent Recordings</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.recentListContent}
                decelerationRate="fast"
                snapToInterval={Math.min(windowWidth * 0.75, 320) + 16} // card width + margin
              >
                {recentMeetings.map(meeting => (
                  <AnimatedPressable
                    key={meeting.id}
                    style={[styles.meetingCardShadow, { width: Math.min(windowWidth * 0.75, 320) }]}
                    onPress={() => router.push({ pathname: '/summary', params: { meetingId: meeting.id } })}
                    scaleTo={0.95}
                  >
                    <BlurView 
                      intensity={Platform.OS === 'android' ? 100 : 70} 
                      tint={theme.name === 'arctic' ? 'light' : 'dark'} 
                      style={styles.meetingCard}
                    >
                      <View style={styles.meetingCardHeader}>
                        <View style={[styles.meetingIconWrapper, { backgroundColor: theme.colors.primary + '20' }]}>
                          <FileText size={22} color={theme.colors.primary} />
                        </View>
                        <ChevronRight size={20} color={theme.colors.textMuted} />
                      </View>
                      
                      <View style={styles.meetingInfo}>
                        <Text style={[styles.meetingTitle, { color: theme.colors.text }]} numberOfLines={2}>
                          {meeting.title || 'Untitled Recording'}
                        </Text>
                        <Text style={[styles.meetingDate, { color: theme.colors.textMuted }]}>
                          {new Date(meeting.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(meeting.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                      </View>
                    </BlurView>
                  </AnimatedPressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Join Call Modal */}
      <JoinCallModal visible={joinModalVisible} onClose={() => setJoinModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  headline: {
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -1,
  },
  centerStage: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  idleState: { alignItems: 'center', width: '100%' },
  recordingState: { alignItems: 'center', width: '100%' },
  processingState: { alignItems: 'center', width: '100%' },

  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
  },
  mainOrb: {
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
  joinCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'center',
  },
  joinCallIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinCallText: {
    fontSize: 15,
    fontWeight: '600',
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
    marginTop: 32,
    width: '100%',
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  recentListContent: { 
    paddingRight: 24, 
    paddingBottom: 10, // space for shadow
  },
  meetingCardShadow: {
    width: width * 0.75,
    marginRight: 16,
    borderRadius: 24,
    // Apple style soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  meetingCard: {
    borderRadius: 24,
    padding: 20,
    height: 140,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  meetingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  meetingIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingInfo: { 
    marginTop: 'auto' 
  },
  meetingTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  meetingDate: { 
    fontSize: 13,
    fontWeight: '500',
  },
});
