import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface RenameModalProps {
  visible: boolean;
  onClose: () => void;
  initialName: string;
  onSave: (newName: string) => void;
}

export function RenameModal({ visible, onClose, initialName, onSave }: RenameModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState(initialName);

  const [shouldRender, setShouldRender] = useState(visible);
  const animOpacity = useSharedValue(0);
  const animScale = useSharedValue(0.95);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      animOpacity.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) });
      animScale.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) });
    } else {
      animOpacity.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) runOnJS(setShouldRender)(false);
      });
      animScale.value = withTiming(0.95, { duration: 180, easing: Easing.in(Easing.quad) });
    }
  }, [visible]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: animOpacity.value,
    transform: [{ scale: animScale.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: animOpacity.value,
  }));

  useEffect(() => {
    setName(initialName || 'Untitled Meeting');
  }, [initialName, visible]);

  if (!shouldRender) return null;

  return (
    <Modal visible={shouldRender} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </BlurView>
        
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
          <Animated.View 
            style={[
              styles.modal, 
              { 
                backgroundColor: theme.colors.modalSurface, 
                borderColor: theme.colors.modalBorder,
                shadowColor: theme.colors.modalShadow
              },
              cardAnimStyle,
            ]}
          >
            <Text variant="h3" style={{ marginBottom: 16, color: theme.colors.text }}>
              Rename Transcript
            </Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
              value={name}
              onChangeText={setName}
              autoFocus
              selectionColor={theme.colors.primary}
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: theme.colors.surfaceHighlight }]}>
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  onSave(name);
                  onClose();
                }} 
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
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
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
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
