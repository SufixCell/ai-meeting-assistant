import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Platform, TouchableOpacity, Share as RNShare } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Mic, Search, ChevronRight, FileText, CheckCircle2, Clock, MoreVertical } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { JoinCallModal } from '../../components/join-call-modal';
import { AnimatedPressable } from '../../components/animated-pressable';
import { useBotSession } from '../../contexts/BotSessionContext';
import { BotStatusCard } from '../../components/bot-status-card';
import { setFABPressHandler } from '../../components/ui/floating-nav';
import { RecordModal } from '../../components/RecordModal';
import { CaptureHero } from '../../components/CaptureHero';
import { ImportModal } from '../../components/ImportModal';
import { useSidebar } from '../../contexts/SidebarContext';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { SearchBar } from '../../components/ui/SearchBar';
import { ActionMenuModal } from '../../components/ActionMenuModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { RenameModal } from '../../components/RenameModal';
import { exportTranscript } from '../../utils/export';
import { useMeetings } from '../../contexts/MeetingsContext';
import { LayoutAnimation } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, withRepeat, withSequence } from 'react-native-reanimated';

let homeRenderCount = 0;

export default function HomeScreen() {
  homeRenderCount++;
  console.log(`[PIPELINE] Home render count: ${homeRenderCount}`);
  const { theme } = useTheme();
  const { user } = useAuth();
  const { openSidebar } = useSidebar();
  const { meetings, deleteMeeting, renameMeeting } = useMeetings();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeMenuTitle, setActiveMenuTitle] = useState<string>('');
  
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameTargetTitle, setRenameTargetTitle] = useState<string>('');

  const pageTransition = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  const openModal = (setter: (val: boolean) => void) => {
    setTimeout(() => {
      pageTransition.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      setter(true);
    }, 40);
  };

  const closeModal = (setter: (val: boolean) => void) => {
    pageTransition.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
    setter(false);
  };

  useEffect(() => {
    setFABPressHandler(() => openModal(setRecordModalVisible));
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Removed local useFocusEffect and fetchMeetings as MeetingsContext handles it

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.email?.split('@')[0] || 'there';
  const activeMeeting = meetings.length > 0 ? meetings[0] : null;
  const recentList = meetings.slice(0, 6);

  const animatedPageStyle = useAnimatedStyle(() => {
    const translateX = interpolate(pageTransition.value, [0, 1], [0, -16]);
    const scale = interpolate(pageTransition.value, [0, 1], [1, 0.98]);
    const opacity = interpolate(pageTransition.value, [0, 1], [1, 0.4]);
    return {
      transform: [{ translateX }, { scale }],
      opacity,
    };
  });

  const animatedPulseStyle = useAnimatedStyle(() => ({
    borderColor: theme.colors.primary,
    borderWidth: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: interpolate(pulseAnim.value, [1, 1.05], [0.4, 0.8]),
    shadowRadius: interpolate(pulseAnim.value, [1, 1.05], [10, 20]),
    elevation: interpolate(pulseAnim.value, [1, 1.05], [4, 8]),
  }));

  const handleCaptureFinished = (transcript: string) => {
    router.push({
      pathname: '/(tabs)/summary',
      params: { transcript, ts: Date.now().toString() },
    });
  };

  const renderIntelligenceRow = () => (
    <View style={styles.intelligenceRow}>
      <Text variant="label" muted style={{ marginBottom: 12 }}>AI Noticed</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.insightsScroll}>
        <Card variant="glass" padding={12} style={styles.insightTag}>
          <View style={[styles.insightDot, { backgroundColor: theme.colors.warning }]} />
          <Text variant="caption">3 action items pending</Text>
        </Card>
        <Card variant="glass" padding={12} style={styles.insightTag}>
          <View style={[styles.insightDot, { backgroundColor: theme.colors.danger }]} />
          <Text variant="caption">Finance meeting has no summary</Text>
        </Card>
        <Card variant="glass" padding={12} style={styles.insightTag}>
          <View style={[styles.insightDot, { backgroundColor: theme.colors.success }]} />
          <Text variant="caption">Interview transcript finished</Text>
        </Card>
      </ScrollView>
    </View>
  );

  const renderTimeline = () => (
    <View style={styles.timeline}>
      <Text variant="h2" style={{ marginBottom: 24, paddingHorizontal: 4 }}>Recent Conversations</Text>
      {recentList.map((meeting, index) => {
        const isLast = index === recentList.length - 1;
        return (
          <View style={styles.timelineItem} key={meeting.id}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]} />
              {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} />}
            </View>
            <AnimatedPressable 
              scaleTo={0.98} 
              onPress={() => router.push({ pathname: '/(tabs)/summary', params: { meetingId: meeting.id } })}
              style={styles.timelineContent}
            >
              <Card variant="ghost" padding={0}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" style={{ fontWeight: '600' }}>{meeting.title || 'Untitled Meeting'}</Text>
                    <Text variant="caption" muted style={{ marginTop: 4 }}>
                      {new Date(meeting.created_at).toLocaleDateString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={{ padding: 4, marginLeft: 8 }} 
                    onPress={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(meeting.id);
                      setActiveMenuTitle(meeting.title || 'Untitled Meeting');
                    }}
                  >
                    <MoreVertical size={20} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </Card>
            </AnimatedPressable>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[{ flex: 1 }, animatedPageStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Top Bar with Avatar */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={openSidebar} style={[styles.avatarButton, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 18 }}>S</Text>
              </TouchableOpacity>
            </View>

            {/* Editorial Greeting */}
            <View style={styles.header}>
              <Text variant="display" style={{ marginBottom: 8, letterSpacing: -1.5 }}>
                {greeting()}.
              </Text>
              <Text variant="h2" muted style={{ fontWeight: '400', letterSpacing: -0.5 }}>
                What do you want to remember today?
              </Text>
            </View>

            {/* Magical Search */}
            <View style={styles.searchContainer}>
              <SearchBar 
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder='Search everything... "Find where Ali mentioned pricing"' 
                style={[styles.hugeSearch, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              />
            </View>

            {renderIntelligenceRow()}

            <View style={styles.workspace}>
              {isDesktop ? (
                <View style={styles.desktopRow}>
                  <View style={styles.mainCol}>
                    <CaptureHero onProcessingFinished={handleCaptureFinished} />
                    <View style={{ height: 48 }} />
                    {renderTimeline()}
                  </View>
                  <View style={styles.sideCol}>
                    {activeMeeting && (
                      <View style={{ marginBottom: 32 }}>
                        <Text variant="label" muted style={{ marginBottom: 12 }}>Continue Working</Text>
                        <Card variant="glass" padding={20}>
                          <Text variant="body" style={{ fontWeight: '600', marginBottom: 12 }}>{activeMeeting.title}</Text>
                          <AnimatedPressable 
                            style={[styles.resumeBtn, { backgroundColor: theme.colors.surfaceHighlight }]}
                            onPress={() => router.push({ pathname: '/(tabs)/summary', params: { meetingId: activeMeeting.id } })}
                          >
                            <Text variant="body" color={theme.colors.primary}>Resume</Text>
                            <ChevronRight size={16} color={theme.colors.primary} />
                          </AnimatedPressable>
                        </Card>
                      </View>
                    )}
                    <Text variant="label" muted style={{ marginBottom: 12 }}>Quick Actions</Text>
                    <View style={styles.sideActions}>
                      <AnimatedPressable style={[styles.sideActionBtn, { backgroundColor: theme.colors.surface }]} onPress={() => openModal(setJoinModalVisible)}>
                        <Text variant="body">Join Bot</Text>
                      </AnimatedPressable>
                      <AnimatedPressable style={[styles.sideActionBtn, { backgroundColor: theme.colors.surface }]} onPress={() => openModal(setImportModalVisible)}>
                        <Text variant="body">Import Audio</Text>
                      </AnimatedPressable>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.mobileLayout}>
                  <CaptureHero onProcessingFinished={handleCaptureFinished} />
                  
                  {activeMeeting && (
                    <Card variant="glass" padding={20} style={{ marginVertical: 32 }}>
                      <Text variant="label" muted style={{ marginBottom: 8 }}>Continue Working</Text>
                      <Text variant="body" style={{ fontWeight: '600', marginBottom: 12 }}>{activeMeeting.title}</Text>
                      <AnimatedPressable 
                        style={[styles.resumeBtn, { backgroundColor: theme.colors.surfaceHighlight }]}
                        onPress={() => router.push({ pathname: '/(tabs)/summary', params: { meetingId: activeMeeting.id } })}
                      >
                        <Text variant="body" color={theme.colors.primary}>Resume</Text>
                        <ChevronRight size={16} color={theme.colors.primary} />
                      </AnimatedPressable>
                    </Card>
                  )}

                  {renderTimeline()}
                </View>
              )}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <RecordModal visible={recordModalVisible} onClose={() => closeModal(setRecordModalVisible)} />
      <JoinCallModal visible={joinModalVisible} onClose={() => closeModal(setJoinModalVisible)} />
      <ImportModal visible={importModalVisible} onClose={() => closeModal(setImportModalVisible)} />
      
      <ActionMenuModal 
        visible={activeMenuId !== null} 
        onClose={() => setActiveMenuId(null)} 
        title={activeMenuTitle}
        onRename={() => {
          if (activeMenuId && activeMenuTitle) {
            setRenameTargetId(activeMenuId);
            setRenameTargetTitle(activeMenuTitle);
            setRenameModalVisible(true);
          }
        }}
        onExport={async () => {
          if (activeMenuId && activeMenuTitle) {
            const fullData = meetings.find(m => m.id === activeMenuId);
            if (fullData) {
              await exportTranscript(activeMenuTitle, {
                summary: fullData.summary ?? '',
                transcript: '', // Metadata only, full transcript needs lazy fetch if we want it on home. But for now, just what's in context.
                date: fullData.created_at
              });
            }
          }
          setActiveMenuId(null);
        }}
        onDelete={() => {
          if (activeMenuId) {
            setDeleteTargetId(activeMenuId);
            setDeleteModalVisible(true);
          }
          setActiveMenuId(null);
        }}
      />

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeleteTargetId(null);
        }}
        onConfirm={async () => {
          if (deleteTargetId) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            await deleteMeeting(deleteTargetId);
          }
        }}
      />

      <RenameModal
        visible={renameModalVisible}
        onClose={() => {
          setRenameModalVisible(false);
          setRenameTargetId(null);
        }}
        initialName={renameTargetTitle}
        onSave={async (newName) => {
          if (renameTargetId && newName.trim()) {
            await renameMeeting(renameTargetId, newName.trim());
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 48, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  
  header: { marginBottom: 40 },
  
  searchContainer: { marginBottom: 40 },
  hugeSearch: { height: 64, borderRadius: 20, paddingHorizontal: 20 },

  intelligenceRow: { marginBottom: 48 },
  insightsScroll: { gap: 12, paddingRight: 24 },
  insightTag: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 99 },
  insightDot: { width: 8, height: 8, borderRadius: 4 },

  workspace: { flex: 1 },
  desktopRow: { flexDirection: 'row', gap: 48 },
  mainCol: { flex: 7 },
  sideCol: { flex: 3 },
  mobileLayout: { gap: 24 },

  topBar: { marginBottom: 24 },
  avatarButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  timeline: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', minHeight: 80 },
  timelineLeft: { width: 32, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, zIndex: 2, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, marginTop: 4, marginBottom: -4, zIndex: 1 },
  timelineContent: { flex: 1, paddingBottom: 32, paddingLeft: 16 },

  resumeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 },
  sideActions: { gap: 12 },
  sideActionBtn: { padding: 16, borderRadius: 16, alignItems: 'center' },
});
