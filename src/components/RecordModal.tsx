import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Square, Loader2, X, Pause, Play, ChevronDown, Check, Volume2 } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Easing, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme';
import { AudioVisualizer } from './audio-visualizer';
import { AnimatedPressable } from './animated-pressable';
import { useKeyboardShortcuts } from '../contexts/KeyboardShortcutsContext';
import { transcribeAudioBlob } from '../services/transcriptionService';

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

interface AudioDevice {
  deviceId: string;
  label: string;
}

const processingStages = [
  'Capturing audio…',
  'Transcribing with Groq Whisper…',
  'Extracting decisions…',
  'Finding action items…',
  'Building summary…'
];

export function RecordModal({ visible, onClose }: RecordModalProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { registerPauseHandler, registerStopHandler } = useKeyboardShortcuts();

  const [state, setState] = useState<RecordState>('idle');
  const [timer, setTimer] = useState(0);
  const [processingStage, setProcessingStage] = useState(0);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [mediaStream, setMediaStream] = useState<any>(null);

  // Audio Device Selection State
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  const transcriptRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const recognitionActiveRef = useRef(false);
  const shouldBeRecordingRef = useRef(false);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Register hotkeys when modal is open & recording or paused
  useEffect(() => {
    if (visible && (state === 'recording' || state === 'paused')) {
      registerPauseHandler(() => handlePause());
      registerStopHandler(() => handleStop());
    }
    return () => {
      registerPauseHandler(null);
      registerStopHandler(null);
    };
  }, [visible, state]);

  // Enumerate Audio Devices
  const fetchAudioDevices = useCallback(async () => {
    if (Platform.OS === 'web' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        // Request temporary mic permission to reveal device labels
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices
          .filter(d => d.kind === 'audioinput')
          .map((d, index) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${index + 1}`,
          }));

        if (tempStream) {
          tempStream.getTracks().forEach(t => t.stop());
        }

        setAudioDevices(mics);
        if (mics.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(mics[0].deviceId);
        }
      } catch (err) {
        console.warn('Could not enumerate audio devices:', err);
      }
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (visible) {
      fetchAudioDevices();
    }
  }, [visible]);

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
      setShowDevicePicker(false);
    }
  }, [visible]);

  useEffect(() => {
    let interval: any;
    if (state === 'recording') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  // Live Desktop WebSpeech Captions (Preview Only)
  const startRecognition = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let accumulatedFinal = '';
      let currentInterim = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          accumulatedFinal += result[0].transcript + ' ';
        } else {
          currentInterim += result[0].transcript;
        }
      }

      if (accumulatedFinal) {
        transcriptRef.current = accumulatedFinal;
      }
      
      setDisplayTranscript(transcriptRef.current.trim());
      setInterimText(currentInterim.trim());
    };

    rec.onerror = (e: any) => {
      console.log('[WebSpeech Error]', e.error);
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track: any) => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  const handleStartRecording = async () => {
    transcriptRef.current = '';
    setDisplayTranscript('');
    setInterimText('');
    setTimer(0);
    setState('recording');
    shouldBeRecordingRef.current = true;
    audioChunksRef.current = [];

    const audioConstraints: any = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...(selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {}),
    };

    if (Platform.OS === 'web' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        setMediaStream(stream);

        // High-Quality MediaRecorder setup
        const mimeType = (window as any).MediaRecorder?.isTypeSupported?.('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : (window as any).MediaRecorder?.isTypeSupported?.('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

        const mr = new (window as any).MediaRecorder(stream, { mimeType });
        mr.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mr.start(500); // Record audio chunks every 500ms
        mediaRecorderRef.current = mr;

        // Desktop Live Preview
        startRecognition();
      } catch (err) {
        console.error('Microphone access error:', err);
        setDisplayTranscript('Could not access microphone.');
      }
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.pause(); } catch (_) {}
      }
      setState('paused');
    } else if (state === 'paused') {
      setState('recording');
      shouldBeRecordingRef.current = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        try { mediaRecorderRef.current.resume(); } catch (_) {}
      }
      startRecognition();
    }
  };

  const handleStop = async () => {
    stopRecognition();
    setState('processing');
  };

  const handleCancel = () => {
    stopRecognition();
    onClose();
  };

  // Processing & Groq Whisper Single Source of Truth
  useEffect(() => {
    if (state === 'processing') {
      setProcessingStage(0);
      let stage = 0;
      const interval = setInterval(() => {
        stage++;
        if (stage < processingStages.length) {
          setProcessingStage(stage);
        }
      }, 900);

      const processAudioTask = async () => {
        let finalTranscript = '';

        try {
          // 1. Otter.ai Model: Build Audio Blob from MediaRecorder chunks
          if (audioChunksRef.current.length > 0) {
            const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

            console.log(`Audio Blob size: ${audioBlob.size} bytes (${mimeType})`);

            if (audioBlob.size > 100) {
              setProcessingStage(1); // Transcribing with Groq Whisper
              const res = await transcribeAudioBlob(audioBlob, 'Recorded Meeting');
              if (res.transcript && res.transcript.trim().length > 0) {
                finalTranscript = res.transcript.trim();
              }
            }
          }
        } catch (err) {
          console.warn('Cloud Whisper API transcription warning, checking fallback text:', err);
        }

        // Fallback to desktop live preview text if audio blob was empty/failed
        if (!finalTranscript) {
          finalTranscript = transcriptRef.current.trim();
        }

        if (!finalTranscript) {
          finalTranscript = 'Meeting recording completed.';
        }

        clearInterval(interval);

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
      };

      processAudioTask();

      return () => {
        clearInterval(interval);
      };
    }
  }, [state]);

  const previewTranscript = (displayTranscript + interimText).slice(-200);
  const selectedDeviceLabel = audioDevices.find(d => d.deviceId === selectedDeviceId)?.label || 'Default Microphone';

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
              {/* Mic Device Selector Pill */}
              {audioDevices.length > 0 && (
                <View style={{ marginBottom: 28, zIndex: 99 }}>
                  <TouchableOpacity
                    onPress={() => setShowDevicePicker(prev => !prev)}
                    activeOpacity={0.7}
                    style={[
                      styles.deviceSelectorBtn,
                      {
                        backgroundColor: theme.colors.surfaceHighlight,
                        borderColor: theme.colors.border,
                      }
                    ]}
                  >
                    <Volume2 size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text numberOfLines={1} style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600', maxWidth: 220 }}>
                      {selectedDeviceLabel}
                    </Text>
                    <ChevronDown size={16} color={theme.colors.textMuted} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>

                  {/* Device Dropdown Menu */}
                  {showDevicePicker && (
                    <View style={[styles.deviceDropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <ScrollView style={{ maxHeight: 180 }}>
                        {audioDevices.map((device) => {
                          const isSelected = device.deviceId === selectedDeviceId;
                          return (
                            <TouchableOpacity
                              key={device.deviceId}
                              onPress={() => {
                                setSelectedDeviceId(device.deviceId);
                                setShowDevicePicker(false);
                              }}
                              style={[
                                styles.deviceOption,
                                isSelected && { backgroundColor: theme.colors.primary + '15' }
                              ]}
                            >
                              <Text numberOfLines={1} style={{ fontSize: 13, color: isSelected ? theme.colors.primary : theme.colors.text, flex: 1, fontWeight: isSelected ? '600' : '400' }}>
                                {device.label}
                              </Text>
                              {isSelected && <Check size={16} color={theme.colors.primary} />}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

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
              <Text style={[styles.tapText, { color: theme.colors.textMuted }]}>Tap orb to begin recording</Text>
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
                   {previewTranscript || 'Listening to microphone audio...'}
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
                Processing via Groq Whisper cloud engine...
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
  deviceSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  deviceDropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  deviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    borderRadius: 20,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  transcriptContainer: {
    width: '100%',
    maxHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  previewText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  visualizerContainer: {
    position: 'relative',
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizerGlow: {
    position: 'absolute',
    width: '80%',
    height: 60,
    borderRadius: 30,
    filter: 'blur(25px)',
    opacity: 0.15,
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  processingText: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  processingSubtext: {
    fontSize: 14,
  },
  controlsBar: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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
