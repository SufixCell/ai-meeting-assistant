import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme';

interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
  maxHeight?: number | string;
}

export function ModalWrapper({
  visible,
  onClose,
  children,
  maxWidth = 480,
  maxHeight = '85%',
}: ModalWrapperProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => {
        setMounted(false);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!mounted && !visible) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {visible && (
        <Animated.View 
          entering={FadeIn.duration(220)} 
          exiting={FadeOut.duration(200)} 
          style={StyleSheet.absoluteFill}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
          </BlurView>

          <View style={styles.centeredWrapper}>
            <Animated.View
              entering={ZoomIn.duration(240)}
              exiting={ZoomOut.duration(180)}
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  maxWidth,
                  maxHeight: maxHeight as any,
                },
              ]}
            >
              {children}
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
});
