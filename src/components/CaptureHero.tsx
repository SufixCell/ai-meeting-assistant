import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import { Card } from './ui/Card';
import { Mic, Square, Pause, Play, Sparkles } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, withRepeat, withSequence, FadeIn, FadeOut, Layout, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRecording, processingStages } from '../hooks/useRecording';
import { AudioVisualizer } from './audio-visualizer';

interface CaptureHeroProps {
  onProcessingFinished?: (transcript: string) => void;
  onJoinMeeting?: () => void;
  onImport?: () => void;
}

export function CaptureHero({ onProcessingFinished, onJoinMeeting, onImport }: CaptureHeroProps) {
  const { theme } = useTheme();
  
  const { 
    state, 
    timer, 
    displayTranscript, 
    interimText, 
    processingStage, 
    mediaStream, 
    startRecording, 
    pauseRecording, 
    stopRecording 
  } = useRecording(onProcessingFinished);

  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (state === 'recording') {
      console.log('[Recording] Started');
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else if (state === 'processing') {
      console.log('[Recording] Finished');
    } else {
      pulseAnim.value = withTiming(1);
    }
  }, [state]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: state === 'recording' ? interpolate(pulseAnim.value, [1, 1.05], [0.3, 0.6]) : 0,
    transform: [{ scale: state === 'recording' ? pulseAnim.value : 1 }]
  }));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const previewTranscript = (displayTranscript + interimText).slice(-150);
  
  useEffect(() => {
    if (displayTranscript) {
      console.log(`[Transcript] Generated (length: ${displayTranscript.length})`);
    }
  }, [displayTranscript]);

  // Simulated AI Detections based on timer
  const renderLiveAIBadges = () => {
    if (timer < 4) return null;
    return (
      <View style={styles.aiBadgesContainer}>
        <View style={styles.badgeRow}>
          <Sparkles size={12} color={theme.colors.primary} style={{ marginRight: 6 }} />
          <Text variant="label" style={{ color: theme.colors.primary, fontSize: 10 }}>AI noticed</Text>
        </View>
        
        {timer >= 4 && (
          <Animated.View entering={FadeIn.duration(400)} style={[styles.aiPill, { backgroundColor: theme.colors.purple + '15', borderColor: theme.colors.purple + '30' }]}>
            <Text style={{ color: theme.colors.purple, fontSize: 12, fontWeight: '600' }}>Decision detected</Text>
          </Animated.View>
        )}
        
        {timer >= 8 && (
          <Animated.View entering={FadeIn.duration(400)} style={[styles.aiPill, { backgroundColor: theme.colors.success + '15', borderColor: theme.colors.success + '30', marginTop: 8 }]}>
            <Text style={{ color: theme.colors.success, fontSize: 12, fontWeight: '600' }}>Action Item: Send proposal tomorrow</Text>
          </Animated.View>
        )}
      </View>
    );
  };

  if (state === 'idle') {
    return (
      <View style={[styles.stitchHeroCard, { backgroundColor: '#2e3447', borderColor: '#464555' }]}>
        <View style={styles.stitchCardContent}>
          <TouchableOpacity activeOpacity={0.85} onPress={startRecording} style={styles.stitchMicBtn}>
            <Mic size={32} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.stitchTextGroup}>
            <Text variant="h2" style={{ color: '#dce1fb', fontWeight: '600', textAlign: 'center', fontSize: 22 }}>
              AI-powered real-time transcription
            </Text>
            <Text variant="body" style={{ color: '#c7c4d8', marginTop: 4, textAlign: 'center', fontSize: 14 }}>
              Ready to capture every insight from your conversation.
            </Text>
          </View>

          <View style={styles.stitchActionRow}>
            <TouchableOpacity activeOpacity={0.8} onPress={startRecording} style={styles.stitchStartBtn}>
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 15 }}>Start Recording</Text>
            </TouchableOpacity>

            <View style={styles.stitchSecondaryRow}>
              {onJoinMeeting && (
                <TouchableOpacity activeOpacity={0.8} onPress={onJoinMeeting} style={styles.stitchSecondaryBtn}>
                  <Text style={{ color: '#dce1fb', fontSize: 14, fontWeight: '500' }}>+ Join Meeting</Text>
                </TouchableOpacity>
              )}
              {onImport && (
                <TouchableOpacity activeOpacity={0.8} onPress={onImport} style={styles.stitchSecondaryBtn}>
                  <Text style={{ color: '#dce1fb', fontSize: 14, fontWeight: '500' }}>↑ Import</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View layout={Layout.springify().damping(20)} style={styles.heroWrapper}>
      <View style={[
        styles.heroCard, 
        styles.recordingCard,
        { 
          backgroundColor: theme.colors.surface, 
          borderColor: state === 'recording' ? theme.colors.primary : theme.colors.border,
          borderWidth: state === 'recording' ? 1.5 : 1
        }
      ]}>
        
        {/* Background Glow */}
        <Animated.View style={[styles.heroGlow, { backgroundColor: theme.colors.primary }, animatedGlowStyle]} />

        {/* Header: Status and Timer */}
        <View style={styles.recordingHeader}>
          <View style={styles.statusRow}>
            {state === 'processing' ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <Animated.View style={[styles.recordingDot, { backgroundColor: state === 'recording' ? theme.colors.danger : theme.colors.warning }]} />
                <Text style={[styles.statusText, { color: state === 'recording' ? theme.colors.danger : theme.colors.warning }]}>
                  {state === 'paused' ? 'PAUSED' : 'RECORDING...'}
                </Text>
              </>
            )}
          </View>
          <Text style={[styles.timerText, { color: theme.colors.text }]}>
            {state === 'processing' ? '' : formatTime(timer)}
          </Text>
        </View>

        {/* Main Content Area */}
        {state === 'processing' ? (
          <View style={styles.processingContent}>
            <Text variant="h2" style={{ color: theme.colors.text, marginBottom: 8 }}>
              {processingStages[processingStage]}
            </Text>
            <Text variant="body" style={{ color: theme.colors.textMuted }}>
              Almost almost like watching the AI think...
            </Text>
          </View>
        ) : (
          <View style={styles.recordingContent}>
            {/* Visualizer Row */}
            <View style={styles.visualizerRow}>
               <AudioVisualizer isRecording={state === 'recording'} mediaStream={mediaStream} />
            </View>
            
            {/* Live Transcript Area */}
            <View style={styles.transcriptArea}>
               <Text style={[styles.transcriptText, { color: theme.colors.text, opacity: previewTranscript ? 1 : 0.5 }]}>
                 {previewTranscript ? `"${previewTranscript}"` : 'Listening for conversation...'}
               </Text>
            </View>

            {/* AI Insights Sidebar/Overlay inside card */}
            {renderLiveAIBadges()}
          </View>
        )}

        {/* Controls */}
        {state !== 'processing' && (
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={pauseRecording} style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceHighlight }]}>
              {state === 'recording' ? <Pause size={20} color={theme.colors.text} /> : <Play size={20} color={theme.colors.text} />}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={stopRecording} style={[styles.controlBtn, { backgroundColor: theme.colors.danger }]}>
              <Square size={16} color="#FFF" fill="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '600', marginLeft: 8 }}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroWrapper: {
    width: '100%',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  recordingCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 20,
  },
  heroTextContent: {
    flex: 1,
  },
  
  heroGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    filter: 'blur(40px)',
  },

  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8, height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  recordingContent: {
    minHeight: 160,
    zIndex: 2,
    position: 'relative',
  },
  visualizerRow: {
    height: 60,
    marginBottom: 16,
    opacity: 0.8,
  },
  transcriptArea: {
    flex: 1,
    paddingRight: 100, // leave space for badges
  },
  transcriptText: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '500',
    letterSpacing: -0.5,
  },

  aiBadgesContainer: {
    position: 'absolute',
    right: 0,
    top: 60,
    width: 180,
    alignItems: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },

  processingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    zIndex: 2,
  },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
    zIndex: 2,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 99,
  },

  stitchHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justify: 'center',
    marginVertical: 12,
  },
  stitchCardContent: {
    alignItems: 'center',
    width: '100%',
  },
  stitchMicBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  stitchTextGroup: {
    alignItems: 'center',
    marginBottom: 24,
    maxWidth: 500,
  },
  stitchActionRow: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  stitchStartBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stitchSecondaryRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  stitchSecondaryBtn: {
    borderWidth: 1,
    borderColor: '#464555',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});
