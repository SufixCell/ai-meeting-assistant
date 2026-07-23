import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Platform, TouchableOpacity, Share as RNShare } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Mic, Search, ChevronRight, FileText, CheckCircle2, Clock, MoreVertical, Menu } from 'lucide-react-native';
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
import { NotiaLogo } from '../../components/NotiaLogo';
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

  const displayName = user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      user?.user_metadata?.username || 
                      (user?.email ? user.email.split('@')[0] : 'there');
  const initial = displayName.charAt(0).toUpperCase();
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

  const renderRecentMeetingCard = (meeting: any) => {
    const title = meeting.title || 'Untitled Meeting';
    const dateStr = new Date(meeting.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const summarySnippet = meeting.summary || 'Discussed roadmap, action items, and key decisions for the team.';

    return (
      <AnimatedPressable 
        key={meeting.id}
        scaleTo={0.98} 
        onPress={() => router.push({ pathname: '/(tabs)/summary', params: { meetingId: meeting.id } })}
        style={[styles.stitchMeetingCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        <View style={styles.stitchCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>{title}</Text>
            <View style={styles.stitchMetaRow}>
              <Text style={{ fontSize: 12, color: theme.colors.textMuted, fontFamily: Platform.OS === 'web' ? 'Geist, monospace' : 'monospace' }}>{dateStr}</Text>
              <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>•</Text>
              <Text style={{ fontSize: 12, color: theme.colors.textMuted, fontFamily: Platform.OS === 'web' ? 'Geist, monospace' : 'monospace' }}>28m</Text>
              <View style={[styles.stitchBadge, { backgroundColor: theme.colors.surfaceHighlight }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.primary, letterSpacing: 0.5 }}>PROCESSED</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.stitchQuoteBorder, { borderLeftColor: theme.colors.primary }]}>
          <Text numberOfLines={2} style={{ fontSize: 13, color: theme.colors.textMuted, fontStyle: 'italic', lineHeight: 18 }}>
            "{summarySnippet}"
          </Text>
        </View>
      </AnimatedPressable>
    );
  };

  const filteredMeetings = meetings.filter(m => 
    !searchQuery || (m.title && m.title.toLowerCase().includes(searchQuery.toLowerCase())) || (m.summary && m.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[{ flex: 1 }, animatedPageStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Top Bar Header */}
            <View style={[styles.topAppBar, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.brandGroup}>
                {!isDesktop && (
                  <TouchableOpacity onPress={openSidebar} activeOpacity={0.7} style={styles.menuTriggerBtn}>
                    <Menu size={22} color={theme.colors.text} />
                  </TouchableOpacity>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <NotiaLogo size={26} />
                  <Text style={{ color: theme.colors.primary, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 }}>Notia AI</Text>
                </View>
              </View>
              
              <TouchableOpacity onPress={() => {}} style={styles.topIconBtn}>
                <Search size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Hero Greeting Section */}
            <View style={styles.heroSection}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.5 }}>
                {greeting()}, {displayName}
              </Text>
              <Text style={{ fontSize: 14, color: theme.colors.textMuted, marginTop: 4 }}>
                Ready to capture your next meeting?
              </Text>
              
              <View style={styles.heroBadgeRow}>
                <View style={[styles.totalPill, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    📊 {meetings.length || 32} TOTAL MEETINGS
                  </Text>
                </View>
                <Text style={{ color: theme.colors.border }}>•</Text>
                <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                  Last recorded {activeMeeting ? new Date(activeMeeting.created_at).toLocaleDateString() : 'yesterday'}
                </Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
              <View style={[styles.stitchSearchWrap, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                <Search size={18} color={theme.colors.textMuted} style={{ marginRight: 12 }} />
                <SearchBar 
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search meetings, transcripts, or action items..." 
                  style={styles.stitchSearchInput}
                />
              </View>
            </View>

            {/* Primary Capture Hero Card */}
            <CaptureHero 
              onProcessingFinished={handleCaptureFinished}
              onJoinMeeting={() => openModal(setJoinModalVisible)}
              onImport={() => openModal(setImportModalVisible)}
            />

            {/* Recent Meetings */}
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={{ fontSize: 20, fontWeight: '600', color: theme.colors.text }}>Recent Meetings</Text>
                <TouchableOpacity onPress={() => router.push('/history')}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.colors.primary, letterSpacing: 0.5 }}>VIEW ALL</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.meetingsGrid}>
                {filteredMeetings.length > 0 ? (
                  filteredMeetings.slice(0, 5).map(renderRecentMeetingCard)
                ) : (
                  <View style={[styles.stitchMeetingCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: 24, alignItems: 'center' }]}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>No meetings found matching your search.</Text>
                  </View>
                )}
              </View>
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, maxWidth: 896, alignSelf: 'center', width: '100%' },

  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 32,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuTriggerBtn: {
    padding: 6,
    borderRadius: 8,
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justify: 'center',
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justify: 'center',
  },

  heroSection: {
    marginBottom: 32,
    gap: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  totalPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },

  searchSection: {
    marginBottom: 32,
  },
  stitchSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  stitchSearchInput: {
    flex: 1,
    color: '#dce1fb',
    fontSize: 14,
    height: '100%',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },

  recentSection: {
    marginTop: 32,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  meetingsGrid: {
    gap: 16,
  },
  stitchMeetingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  stitchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stitchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  stitchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },

  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0c1324',
    alignItems: 'center',
    justify: 'center',
  },

  stitchQuoteBorder: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    marginTop: 4,
  },
});
