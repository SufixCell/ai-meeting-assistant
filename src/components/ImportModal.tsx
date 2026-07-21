import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, X, FileAudio, AlertCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Easing, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { BlurView } from 'expo-blur';
import { AnimatedPressable } from './animated-pressable';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';

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
    transform: [{ translateX: withTiming(16, { duration: 300, easing: Easing.out(Easing.quad) }) }],
  };
  const initialValues = {
    opacity: 1,
    transform: [{ translateX: 0 }],
  };
  return { initialValues, animations };
};

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ImportModal({ visible, onClose }: ImportModalProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme.name !== 'arctic';

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickAndUpload = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      
      // Basic size validation (25MB limit for typical Whisper APIs)
      if (file.size && file.size > 25 * 1024 * 1024) {
        setError("Audio file must be smaller than 25MB.");
        return;
      }

      const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      if (!groqKey) {
        setError("Groq API key is missing. Please add EXPO_PUBLIC_GROQ_API_KEY to your .env file.");
        return;
      }

      setIsProcessing(true);

      const formData = new FormData();
      // On web, file.file is the actual JS File object. On mobile, we use uri/name/type.
      if (Platform.OS === 'web' && file.file) {
        formData.append('file', file.file);
      } else {
        formData.append('file', {
          uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
          name: file.name,
          type: file.mimeType || 'audio/mpeg',
        } as any);
      }
      formData.append('model', 'whisper-large-v3');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Transcription failed: ${errText}`);
      }

      const data = await response.json();
      const transcript = data.text;

      if (!transcript || transcript.trim().length === 0) {
        throw new Error("No speech detected in this audio file.");
      }

      onClose();
      // Wait a moment for modal to close before routing
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)/summary',
          params: { transcript, ts: Date.now().toString() },
        });
        setIsProcessing(false);
      }, 300);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during upload.");
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={isProcessing ? undefined : onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <Animated.View
          entering={customEntering}
          exiting={customExiting}
          style={styles.sheetWrapper}
        >
          <BlurView
            intensity={isDark ? 60 : 90}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.sheet, { borderColor: theme.colors.border }]}
          >
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <View style={[styles.headerIcon, { backgroundColor: theme.colors.primary + '22' }]}>
                  <Upload size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Import Recording</Text>
              </View>
              {!isProcessing && (
                <AnimatedPressable onPress={onClose} scaleTo={0.88}
                  style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                  <X size={18} color={theme.colors.textMuted} />
                </AnimatedPressable>
              )}
            </View>

            <AnimatedPressable 
              onPress={handlePickAndUpload} 
              disabled={isProcessing}
              scaleTo={0.98}
              style={[styles.dropZone, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceHighlight }]}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 16 }} />
                  <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '600', marginBottom: 8 }}>
                    Transcribing audio...
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' }}>
                    This usually takes a few seconds depending on the file size.
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.uploadCircle, { backgroundColor: theme.colors.surface }]}>
                    <FileAudio size={32} color={theme.colors.primary} />
                  </View>
                  <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '600', marginBottom: 8 }}>
                    Select an audio file
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' }}>
                    Upload an MP3, M4A, or WAV file to instantly generate a transcript and action items using Whisper.
                  </Text>
                </>
              )}
            </AnimatedPressable>

            {error && (
              <View style={[styles.errorBanner, { backgroundColor: '#EF444420' }]}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    marginHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  sheet: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  }
});
