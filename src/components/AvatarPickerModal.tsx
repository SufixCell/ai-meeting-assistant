import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { X, CheckCircle2, User } from 'lucide-react-native';
import { AVATAR_OPTIONS, AvatarOption } from '../constants/avatars';
import { ThemeAvatar } from './ThemeAvatar';
import { BlurView } from 'expo-blur';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onSelectAvatar?: (url: string) => void;
}

export function AvatarPickerModal({
  visible,
  onClose,
  currentAvatarUrl,
  onSelectAvatar,
}: AvatarPickerModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();

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

  if (!shouldRender) return null;

  const handleSelect = async (option: AvatarOption) => {
    // 1. Trigger parent callback if provided
    if (onSelectAvatar) {
      onSelectAvatar(option.url);
    }

    // 2. Persist to Supabase user_metadata & localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('notia_user_avatar', option.url);
      }
      if (user) {
        await supabase.auth.updateUser({
          data: { avatar_url: option.url }
        });
      }
    } catch (e) {
      console.warn('Could not persist avatar choice:', e);
    }
  };

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
              },
              cardAnimStyle,
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.headerTitleGroup}>
                <View style={[styles.iconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                  <User size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text variant="h2" style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>
                    Choose Avatar
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                    Pick an avatar that suits your style
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Avatars Grid - NO UPLOAD BUTTON PLACEHOLDER */}
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.gridContent}>
              {AVATAR_OPTIONS.map((item) => {
                const isSelected = currentAvatarUrl === item.url;

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                    style={[
                      styles.avatarTile,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary + '20'
                          : theme.colors.surfaceHighlight,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                  >
                    <ThemeAvatar url={item.url} size={54} showBorder={false} />

                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.text, marginTop: 6 }}>
                      {item.name}
                    </Text>

                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <CheckCircle2 size={16} color={theme.colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    maxWidth: 480,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  scrollArea: {
    flex: 1,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 20,
    justifyContent: 'center',
  },
  avatarTile: {
    width: 90,
    height: 96,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
