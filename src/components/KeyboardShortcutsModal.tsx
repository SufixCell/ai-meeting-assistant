import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Keyboard, X, Pause, Square, RotateCcw } from 'lucide-react-native';
import { useKeyboardShortcuts } from '../contexts/KeyboardShortcutsContext';
import { BlurView } from 'expo-blur';

interface KeyboardShortcutsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ visible, onClose }: KeyboardShortcutsModalProps) {
  const { theme } = useTheme();
  const { keybinds, updatePauseKey, updateStopKey, resetDefaults } = useKeyboardShortcuts();

  const [bindingTarget, setBindingTarget] = useState<'pause' | 'stop' | null>(null);

  useEffect(() => {
    if (!bindingTarget || Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let label = e.key.toUpperCase();
      if (e.code === 'Space') label = 'SPACE';
      else if (e.code === 'Escape') label = 'ESC';
      else if (e.code === 'Enter') label = 'ENTER';
      else if (label.length === 1) label = label.toUpperCase();

      if (bindingTarget === 'pause') {
        updatePauseKey(e.code, label);
      } else if (bindingTarget === 'stop') {
        updateStopKey(e.code, label);
      }

      setBindingTarget(null);
    };

    window.addEventListener('keydown', handleKeyCapture, { capture: true, once: true });
    return () => window.removeEventListener('keydown', handleKeyCapture, { capture: true });
  }, [bindingTarget]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </BlurView>

        <View style={styles.centeredWrapper}>
          <Animated.View 
            entering={FadeIn.duration(250)} 
            exiting={FadeOut.duration(200)}
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.headerTitleGroup}>
                <View style={[styles.iconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Keyboard size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text variant="h2" style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>
                    Keyboard Shortcuts
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                    Desktop web recording controls
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity onPress={resetDefaults} style={[styles.resetBtn, { backgroundColor: theme.colors.surfaceHighlight }]}>
                  <RotateCcw size={13} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' }}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Shortcuts Binds List */}
            <View style={styles.contentBody}>
              
              {/* Option 1: Pause / Resume */}
              <View style={[styles.bindRow, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                <View style={styles.bindInfo}>
                  <View style={[styles.actionIconBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Pause size={16} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>
                      Pause / Resume
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                      Toggle active recording state
                    </Text>
                  </View>
                </View>

                <View style={styles.bindControlGroup}>
                  <View style={[styles.keyBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primary, fontFamily: Platform.OS === 'web' ? 'monospace' : 'normal' }}>
                      {keybinds.pauseLabel}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setBindingTarget(bindingTarget === 'pause' ? null : 'pause')}
                    style={[
                      styles.bindBtn,
                      {
                        backgroundColor: bindingTarget === 'pause' ? theme.colors.primary : theme.colors.surface,
                        borderColor: bindingTarget === 'pause' ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                  >
                    <Text style={{ color: bindingTarget === 'pause' ? '#FFF' : theme.colors.text, fontSize: 13, fontWeight: '600' }}>
                      {bindingTarget === 'pause' ? 'Press any key…' : 'Add bind'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Option 2: Stop & Process */}
              <View style={[styles.bindRow, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                <View style={styles.bindInfo}>
                  <View style={[styles.actionIconBadge, { backgroundColor: theme.colors.danger + '20' }]}>
                    <Square size={14} color={theme.colors.danger} fill={theme.colors.danger} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>
                      Stop Recording
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                      Finish session and generate summary
                    </Text>
                  </View>
                </View>

                <View style={styles.bindControlGroup}>
                  <View style={[styles.keyBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.danger, fontFamily: Platform.OS === 'web' ? 'monospace' : 'normal' }}>
                      {keybinds.stopLabel}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setBindingTarget(bindingTarget === 'stop' ? null : 'stop')}
                    style={[
                      styles.bindBtn,
                      {
                        backgroundColor: bindingTarget === 'stop' ? theme.colors.primary : theme.colors.surface,
                        borderColor: bindingTarget === 'stop' ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                  >
                    <Text style={{ color: bindingTarget === 'stop' ? '#FFF' : theme.colors.text, fontSize: 13, fontWeight: '600' }}>
                      {bindingTarget === 'stop' ? 'Press any key…' : 'Add bind'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>

            {/* Footer helper */}
            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center' }}>
                Keybinds trigger automatically during recording when not typing in text fields.
              </Text>
            </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  contentBody: {
    padding: 20,
    gap: 12,
  },
  bindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  bindInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
    gap: 12,
  },
  actionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bindControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bindBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
  },
});
