import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBotSession } from '../contexts/BotSessionContext';
import { Mic, Square, Loader2, X, Pause, Play } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Easing, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme';
import { AudioVisualizer } from './audio-visualizer';
import { AnimatedPressable } from './animated-pressable';

const customEntering = () => {
  'worklet';
  const animations = {
    opacity: withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
    transform: [{ translateX: withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) }) }],
  };
  const initialValues = {
    opacity: 0,
    transform: [{ translateX: 16 }],
  };
  return { initialValues, animations };
};

const customExiting = () => {
  'worklet';
  const animations = {
    opacity: withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) }),
    transform: [{ translateX: 16 }, { translateY: 0 }],
  };
  const initialValues = {
    opacity: 1,
    transform: [{ translateX: 0 }],
  };
  return { initialValues, animations };
};

type RecordState = 'idle' | 'recording' | 'paused' | 'processing';

interface RecordModalProps {
  visible: boolean;
  onClose: () => void;
}

const processingStages = [
  'Capturing audio…',
  'Generating transcript…',
  'Extracting decisions…',
  'Finding action items…',
  'Building summary…'
];

export function RecordModal({ visible, onClose }: RecordModalProps) {
  const { theme } = useTheme();
  const router = useRouter();

  const [state, setState] = useState<RecordState>('idle');
  const [timer, setTimer] = useState(0);
  const [processingStage, setProcessingStage] = useState(0);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [mediaStream, setMediaStream] = useState<any>(null);

  const transcriptRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const recognitionActiveRef = useRef(false);
  const shouldBeRecordingRef = useRef(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!visible) {
      if (state !== 'idle') {
        handleStop(); // clean up if forcefully closed
      }
      setState('idle');
      setTimer(0);
      setDisplayTranscript('');
      setInterimText('');
      setProcessingStage(0);
    }
  }, [visible]);

  useEffect(() => {
    let interval: any;
    if (state === 'recording') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (visible && Platform.OS === 'web' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach(track => track.stop());
        })
        .catch((err) => {
          console.warn('Microphone permission error:', err);
        });
    }
  }, [visible]);

  const startRecognition = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setDisplayTranscript('Browser not supported.');
      return;
    }

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
      recognitionActiveRef.current = false;
    };

    rec.onend = () => {
      recognitionActiveRef.current = false;
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
    try { rec.start(); } catch (e) { }
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

  const handleStartRecording = () => {
    transcriptRef.current = '';
    setDisplayTranscript('');
    setInterimText('');
    setTimer(0);
    setState('recording');
    shouldBeRecordingRef.current = true;
    
    if (Platform.OS === 'web' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          setMediaStream(stream);
          startRecognition();
        })
        .catch(err => {
          setDisplayTranscript('Microphone access denied.');
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

  const handleCancel = () => {
    stopRecognition();
    onClose();
  };

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

      const groqTimer = setTimeout(async () => {
        clearInterval(interval);
        const finalTranscript = transcriptRef.current.trim();
        router.push({
          pathname: '/(tabs)/summary',
          params: { transcript: finalTranscript, ts: Date.now().toString() },
        });
        onClose();
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

  const previewTranscript = (displayTranscript + interimText).slice(-200);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View 
        entering={customEntering}
        exiting={customExiting}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <SafeAreaView style={[styles.container]} edges={['top', 'bottom']}>
          {/* Header bar */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Record Meeting</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Center stage */}
          <View style={styles.centerStage}>
          {state === 'idle' && (
            <>
              <AnimatedPressable onPress={handleStartRecording} scaleTo={0.9}>
                <View style={styles.cinematicOrbWrapper}>
                  <View style={[styles.cinematicOrbGlow, { backgroundColor: theme.colors.primary }]} />
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.purple]}
                    style={styles.bigOrb}
                  >
                    <Mic size={64} color="#FFF" />
                  </LinearGradient>
                </View>
              </AnimatedPressable>
              <Text style={[styles.tapText, { color: theme.colors.textMuted }]}>Begin intelligence capture</Text>
            </>
          )}

          {(state === 'recording' || state === 'paused') && (
            <View style={styles.recordingContainer}>
              <View style={styles.topBadges}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>RECORDING</Text>
                </View>
                <Text style={[styles.timerText, { color: theme.colors.textMuted }]}>{formatTime(timer)}</Text>
              </View>

              <View style={styles.transcriptContainer}>
                 <Text style={[styles.previewText, { color: theme.colors.text }]}>
                   {previewTranscript || 'Listening for conversation...'}
                 </Text>
              </View>

              <View style={styles.visualizerContainer}>
                 <View style={[styles.visualizerGlow, { backgroundColor: theme.colors.primary }]} />
                 <AudioVisualizer isRecording={state === 'recording'} mediaStream={mediaStream} />
              </View>
            </View>
          )}

          {state === 'processing' && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.processingText, { color: theme.colors.text }]}>
                {processingStages[processingStage]}
              </Text>
              <Text style={[styles.processingSubtext, { color: theme.colors.textMuted }]}>
                Extracting conversation intelligence...
              </Text>
            </View>
          )}
        </View>

        {/* Controls bar */}
        <View style={styles.controlsBar}>
          {(state === 'recording' || state === 'paused') && (
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                <Text style={[styles.cancelText, { color: theme.colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handlePause} style={[styles.circleBtn, { backgroundColor: theme.colors.surfaceHighlight }]}>
                {state === 'recording' ? <Pause size={28} color={theme.colors.text} /> : <Play size={28} color={theme.colors.text} />}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleStop} style={[styles.circleBtn, { backgroundColor: theme.colors.primary }]}>
                <Square size={24} color="#FFF" fill="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    width: '100%',
  },
  cinematicOrbWrapper: {
    position: 'relative',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cinematicOrbGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    filter: 'blur(30px)',
    opacity: 0.5,
  },
  bigOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapText: {
    fontSize: 18,
    marginTop: 32,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  recordingContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  topBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444420',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  transcriptContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  previewText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 44,
    textAlign: 'center',
  },
  visualizerContainer: {
    position: 'relative',
    height: 120,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizerGlow: {
    position: 'absolute',
    width: 200,
    height: 80,
    borderRadius: 40,
    filter: 'blur(40px)',
    opacity: 0.3,
  },
  aiBadge: {
    position: 'absolute',
    bottom: 140,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 32,
  },
  processingSubtext: {
    fontSize: 16,
    marginTop: 8,
  },
  controlsBar: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    height: 100,
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  circleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
