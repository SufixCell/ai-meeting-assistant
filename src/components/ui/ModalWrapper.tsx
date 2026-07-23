import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
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
  const [shouldRender, setShouldRender] = useState(visible);
  const animOpacity = useSharedValue(0);
  const animScale = useSharedValue(0.92);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      animOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
      animScale.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.back(0.8)) });
    } else {
      animOpacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) runOnJS(setShouldRender)(false);
      });
      animScale.value = withTiming(0.92, { duration: 200, easing: Easing.in(Easing.quad) });
    }
  }, [visible]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: animOpacity.value,
    transform: [{ scale: animScale.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: animOpacity.value,
  }));

  if (!shouldRender) return null;

  return (
    <Modal visible={shouldRender} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </BlurView>

        <View style={styles.centeredWrapper}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                maxWidth,
                maxHeight: maxHeight as any,
              },
              cardAnimStyle,
            ]}
          >
            {children}
          </Animated.View>
        </View>
      </Animated.View>
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
