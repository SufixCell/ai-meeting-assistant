import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme';
import { AnimatedPressable } from './animated-pressable';
import { useBotSession, detectPlatform, BotPlatform } from '../contexts/BotSessionContext';
import { Video, Hash, X, Wifi } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Easing, withTiming } from 'react-native-reanimated';

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

// ─── Platform badge icons (text-based since we can't bundle third-party logos) ──

function PlatformBadge({ platform }: { platform: BotPlatform | null }) {
  const { theme } = useTheme();
  if (!platform) return null;
  const labels: Record<BotPlatform, string> = {
    zoom: 'Zoom',
    meet: 'Google Meet',
    teams: 'Teams',
    discord: 'Discord',
  };
  const colors: Record<BotPlatform, string> = {
    zoom: '#2D8CFF',
    meet: '#00897B',
    teams: '#5B5EA6',
    discord: '#5865F2',
  };
  return (
    <View style={[styles.platformBadge, { borderColor: colors[platform] + '60', backgroundColor: colors[platform] + '18' }]}>
      <View style={[styles.platformDot, { backgroundColor: colors[platform] }]} />
      <Text style={[styles.platformBadgeText, { color: colors[platform] }]}>{labels[platform]}</Text>
    </View>
  );
}

// ─── Discord guild/channel stub types ─────────────────────────────────────────

interface DiscordChannel { id: string; name: string; }
interface DiscordGuild { id: string; name: string; channels: DiscordChannel[]; }

// Stub data — Mujtaba replaces with real fetch
const STUB_GUILDS: DiscordGuild[] = [
  { id: 'g1', name: 'TechveraMaal HQ', channels: [{ id: 'c1', name: 'general' }, { id: 'c2', name: 'dev-voice' }] },
  { id: 'g2', name: 'Project Alpha', channels: [{ id: 'c3', name: 'standup' }, { id: 'c4', name: 'brainstorm' }] },
];

// ─── Segmented Control ────────────────────────────────────────────────────────

function SegmentedControl({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.segmentedWrapper, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
      {options.map((opt, i) => (
        <AnimatedPressable
          key={opt}
          onPress={() => onSelect(i)}
          style={[
            styles.segmentItem,
            selected === i && { backgroundColor: theme.colors.primary },
          ]}
          scaleTo={0.95}
        >
          <Text style={[
            styles.segmentText,
            { color: selected === i ? '#FFF' : theme.colors.textMuted },
          ]}>
            {opt}
          </Text>
        </AnimatedPressable>
      ))}
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface JoinCallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function JoinCallModal({ visible, onClose }: JoinCallModalProps) {
  const { theme } = useTheme();
  const { joinMeetingLink, joinDiscord } = useBotSession();

  const [tab, setTab] = useState(0); // 0 = Meeting Link, 1 = Discord
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<BotPlatform | null>(null);
  const [urlError, setUrlError] = useState('');
  const [loading, setLoading] = useState(false);

  // Discord pickers
  const [guilds] = useState<DiscordGuild[]>(STUB_GUILDS);
  const [selectedGuild, setSelectedGuild] = useState<DiscordGuild | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<DiscordChannel | null>(null);

  const isDark = theme.name !== 'arctic';

  const handleUrlChange = useCallback((text: string) => {
    setUrl(text);
    setUrlError('');
    setDetectedPlatform(detectPlatform(text));
  }, []);

  const handleJoinLink = async () => {
    const platform = detectPlatform(url);
    if (!platform) {
      setUrlError('Paste a valid Zoom, Google Meet, or Teams link.');
      return;
    }
    setLoading(true);
    try {
      await joinMeetingLink(url.trim());
      onClose();
    } catch (e: any) {
      setUrlError(e.message || 'Failed to join. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinDiscord = async () => {
    if (!selectedGuild || !selectedChannel) return;
    setLoading(true);
    try {
      await joinDiscord(selectedGuild.id, selectedChannel.id, selectedChannel.name);
      onClose();
    } catch (e: any) {
      setUrlError(e.message || 'Failed to join Discord.');
    } finally {
      setLoading(false);
    }
  };

  const canJoinLink = !!detectedPlatform && !loading;
  const canJoinDiscord = !!selectedGuild && !!selectedChannel && !loading;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
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
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <View style={[styles.headerIcon, { backgroundColor: theme.colors.primary + '22' }]}>
                  <Video size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Join a Meeting</Text>
              </View>
              <AnimatedPressable onPress={onClose} scaleTo={0.88}
                style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                <X size={18} color={theme.colors.textMuted} />
              </AnimatedPressable>
            </View>

            {/* Segmented control */}
            <SegmentedControl
              options={['Meeting Link', 'Discord']}
              selected={tab}
              onSelect={(i) => { setTab(i); setUrlError(''); setUrl(''); setDetectedPlatform(null); }}
            />

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 20 }}>
              {/* ── MEETING LINK TAB ── */}
              {tab === 0 && (
                <View style={styles.tabContent}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Meeting URL</Text>
                  <View style={[styles.inputRow, { backgroundColor: theme.colors.surface, borderColor: urlError ? theme.colors.danger : theme.colors.border }]}>
                    <Wifi size={18} color={theme.colors.textMuted} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.urlInput, { color: theme.colors.text }]}
                      placeholder="Paste Zoom, Meet, or Teams link..."
                      placeholderTextColor={theme.colors.textMuted}
                      value={url}
                      onChangeText={handleUrlChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                  </View>

                  {detectedPlatform && <PlatformBadge platform={detectedPlatform} />}

                  {urlError ? (
                    <View style={[styles.errorBanner, { backgroundColor: theme.colors.danger + '20' }]}>
                      <Text style={[styles.errorText, { color: theme.colors.danger }]}>{urlError}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* ── DISCORD TAB ── */}
              {tab === 1 && (
                <View style={styles.tabContent}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Server</Text>
                  <View style={styles.pickerList}>
                    {guilds.map(guild => (
                      <AnimatedPressable
                        key={guild.id}
                        onPress={() => { setSelectedGuild(guild); setSelectedChannel(null); }}
                        scaleTo={0.97}
                        style={[
                          styles.pickerRow,
                          {
                            backgroundColor: selectedGuild?.id === guild.id ? theme.colors.primary + '22' : theme.colors.surface,
                            borderColor: selectedGuild?.id === guild.id ? theme.colors.primary + '66' : theme.colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.pickerRowText, { color: theme.colors.text }]}>{guild.name}</Text>
                        {selectedGuild?.id === guild.id && (
                          <View style={[styles.selectedDot, { backgroundColor: theme.colors.primary }]} />
                        )}
                      </AnimatedPressable>
                    ))}
                  </View>

                  {selectedGuild && (
                    <>
                      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted, marginTop: 16 }]}>Voice Channel</Text>
                      <View style={styles.pickerList}>
                        {selectedGuild.channels.map(ch => (
                          <AnimatedPressable
                            key={ch.id}
                            onPress={() => setSelectedChannel(ch)}
                            scaleTo={0.97}
                            style={[
                              styles.pickerRow,
                              {
                                backgroundColor: selectedChannel?.id === ch.id ? theme.colors.primary + '22' : theme.colors.surface,
                                borderColor: selectedChannel?.id === ch.id ? theme.colors.primary + '66' : theme.colors.border,
                              },
                            ]}
                          >
                            <Hash size={14} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
                            <Text style={[styles.pickerRowText, { color: theme.colors.text }]}>{ch.name}</Text>
                            {selectedChannel?.id === ch.id && (
                              <View style={[styles.selectedDot, { backgroundColor: theme.colors.primary }]} />
                            )}
                          </AnimatedPressable>
                        ))}
                      </View>
                    </>
                  )}

                  {urlError ? (
                    <View style={[styles.errorBanner, { backgroundColor: theme.colors.danger + '20' }]}>
                      <Text style={[styles.errorText, { color: theme.colors.danger }]}>{urlError}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>

            {/* Join button */}
            <AnimatedPressable
              onPress={tab === 0 ? handleJoinLink : handleJoinDiscord}
              disabled={tab === 0 ? !canJoinLink : !canJoinDiscord}
              scaleTo={0.96}
              style={[
                styles.joinButton,
                {
                  backgroundColor: (tab === 0 ? canJoinLink : canJoinDiscord) ? theme.colors.primary : theme.colors.surfaceHighlight,
                  opacity: (tab === 0 ? canJoinLink : canJoinDiscord) ? 1 : 0.5,
                },
              ]}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.joinButtonText}>{tab === 0 ? 'Send Bot to Call' : 'Send Bot to Channel'}</Text>
              }
            </AnimatedPressable>
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
  segmentedWrapper: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    paddingBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 12,
  },
  urlInput: {
    flex: 1,
    fontSize: 15,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    gap: 6,
    marginBottom: 12,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  platformBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  pickerList: {
    gap: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerRowText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  joinButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
