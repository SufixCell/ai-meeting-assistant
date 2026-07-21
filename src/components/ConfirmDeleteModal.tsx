import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { AlertOctagon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface ConfirmDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({ visible, onClose, onConfirm }: ConfirmDeleteModalProps) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </BlurView>
        
        <View style={styles.container}>
          <Animated.View 
            entering={SlideInDown.duration(300).springify().damping(20)} 
            exiting={SlideOutDown.duration(200)} 
            style={[
              styles.modal, 
              { 
                backgroundColor: theme.colors.modalSurface, 
                borderColor: theme.colors.modalBorder,
                shadowColor: theme.colors.modalShadow 
              }
            ]}
          >
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.danger + '15' }]}>
              <AlertOctagon size={36} color={theme.colors.danger} />
            </View>
            
            <Text variant="h1" style={{ textAlign: 'center', marginBottom: 12, color: theme.colors.text, fontSize: 24 }}>
              Delete Transcript?
            </Text>
            
            <Text variant="body" style={{ textAlign: 'center', color: theme.colors.textMuted, marginBottom: 32, lineHeight: 24 }}>
              You're about to permanently delete this transcript and its insights. This action cannot be undone.
            </Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: theme.colors.surfaceHighlight }]}>
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  onConfirm();
                  onClose();
                }} 
                style={[styles.button, { backgroundColor: theme.colors.danger }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
