import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share as RNShare, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { ArrowLeft, Clock, MoreVertical, Sparkles, CheckCircle2, CheckSquare, Lightbulb } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { generateMeetingSummary, type MeetingSummary } from '../../lib/openrouter';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Badge, type BadgeSource } from '../../components/ui/Badge';
import { Text } from '../../components/ui/Text';
import { AnimatedPressable } from '../../components/animated-pressable';
import { ActionMenuModal } from '../../components/ActionMenuModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { RenameModal } from '../../components/RenameModal';
import { exportTranscript } from '../../utils/export';
import { useMeetings } from '../../contexts/MeetingsContext';

export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { user, initialized } = useAuth();
  const { deleteMeeting, renameMeeting, refreshMeetings, upsertMeeting } = useMeetings();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [rawTranscript, setRawTranscript] = useState('');
  const lastProcessedTranscriptRef = React.useRef<string | null>(null);
  const lastProcessedMeetingIdRef = React.useRef<string | null>(null);
  const lastProcessedTsRef = React.useRef<string | null>(null);
  
  const [checkedActions, setCheckedActions] = useState<Set<number>>(new Set());
  const [meetingSource, setMeetingSource] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);

  const meetingId = params.meetingId as string;
  const transcriptParam = params.transcript as string;
  const precomputedSummary = params.precomputedSummary as string | undefined;
  const precomputedActionItemsRaw = params.precomputedActionItems as string | undefined;
  const tsParam = params.ts as string | undefined;
  const badgeSource: BadgeSource = (() => {
    const normalized = (meetingSource || 'mic').toLowerCase();
    if (normalized === 'google_meet') return 'meet';
    if (['mic', 'zoom', 'meet', 'teams', 'discord', 'bot'].includes(normalized)) {
      return normalized as BadgeSource;
    }
    return 'mic';
  })();

  const getCurrentUserId = async () => {
    if (user?.id) return user.id;

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.id) {
      throw new Error('You must be signed in before saving a transcript.');
    }

    return data.user.id;
  };

  useEffect(() => {
    const init = async () => {
      if (!initialized) return;

      // If we already processed this EXACT timestamp, return early to prevent double-calls.
      // But if tsParam changes (new recording), we ALWAYS run.
      if (tsParam && tsParam === lastProcessedTsRef.current) return;
      if (tsParam) {
        lastProcessedTsRef.current = tsParam;
      } else {
        // Fallback for older links or imports without ts
        if (!meetingId && transcriptParam && transcriptParam === lastProcessedTranscriptRef.current) return;
        if (!meetingId && transcriptParam) {
          lastProcessedTranscriptRef.current = transcriptParam;
          lastProcessedMeetingIdRef.current = null;
        }
      }
      
      if (meetingId && meetingId === lastProcessedMeetingIdRef.current) return;
      if (meetingId) {
        lastProcessedMeetingIdRef.current = meetingId;
        lastProcessedTranscriptRef.current = null;
      }

      setLoading(true);
      setError(null);
      setSummary(null);
      setRawTranscript('');

      try {
        if (meetingId) {
          const { data, error: dbErr } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', meetingId)
            .single();

          if (dbErr) throw dbErr;
          if (data) {
            setRawTranscript(data.transcript || '');
            setSummary({
              title: data.title,
              summary: data.summary,
              actionItems: data.action_items || [],
              keyDecisions: data.key_decisions || [],
              suggestions: data.suggestions || [],
            });
            setMeetingSource(data.source || data.platform || 'Recorded');
            setMeetingDate(new Date(data.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
          }
          setLoading(false);
          return;
        }

        const transcript = transcriptParam || '';
        setRawTranscript(transcript);
        const userId = await getCurrentUserId();

        if (!transcript || transcript.trim().length < 5) {
          const result = {
            title: 'Empty Recording',
            summary: 'No speech was captured. Make sure your microphone is allowed and speak clearly.',
            actionItems: [],
            keyDecisions: [],
            suggestions: [],
          };
          console.log('[Meeting] Object Created (Empty Recording)');
          setSummary(result);
          
          console.log('[Supabase] Insert Started (Empty Recording)');
          const insertRes = await supabase
            .from('meetings')
            .insert({
              user_id: userId,
              title: result.title,
              transcript: transcript || 'No speech captured.',
              summary: result.summary,
              action_items: result.actionItems,
              key_decisions: result.keyDecisions,
            })
            .select('id, title, created_at, summary')
            .single();
          
          
          if (insertRes.error) {
            console.log('[Supabase] Insert Error', insertRes.error);
            throw new Error(`Insert failed: ${insertRes.error.message}`);
          } else {
            console.log('[Supabase] Insert Success');
            upsertMeeting(insertRes.data);
          }
          await refreshMeetings();
          setLoading(false);
          return;
        }

        if (precomputedSummary) {
          let actionItems: string[] = [];
          try { actionItems = JSON.parse(precomputedActionItemsRaw || '[]'); } catch (_) {}
          const result: MeetingSummary = {
            title: 'Bot Meeting',
            summary: precomputedSummary,
            actionItems,
            keyDecisions: [],
            suggestions: [],
          };
          setSummary(result);
          setMeetingSource('Bot');
          setMeetingDate(new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
          
          const insertRes = await supabase
            .from('meetings')
            .insert({
              user_id: userId,
              title: result.title,
              transcript,
              summary: result.summary,
              action_items: result.actionItems,
              key_decisions: result.keyDecisions,
            })
            .select('id, title, created_at, summary')
            .single();
          console.log('Bot Insert Result:', insertRes);
          if (insertRes.error) throw new Error(`Insert failed: ${insertRes.error.message}`);
          upsertMeeting(insertRes.data);
          await refreshMeetings();
          setLoading(false);
          return;
        }

        const result = await generateMeetingSummary(transcript);
        setSummary(result);
        setMeetingSource('Mic');
        setMeetingDate(new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

        const insertRes = await supabase
          .from('meetings')
          .insert({
            user_id: userId,
            title: result.title,
            transcript,
            summary: result.summary,
            action_items: result.actionItems,
            key_decisions: result.keyDecisions,
          })
          .select('id, title, created_at, summary')
          .single();
        if (insertRes.error) {
          console.log('[Supabase] Insert Error', insertRes.error);
          throw new Error(`Insert failed: ${insertRes.error.message}`);
        } else {
          console.log('[Supabase] Insert Success');
          upsertMeeting(insertRes.data);
        }
        await refreshMeetings();

      } catch (err: any) {
        console.error('Summary error:', err);
        setError(err.message || 'Failed to load summary');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [initialized, user?.id, meetingId, transcriptParam, precomputedSummary, tsParam, refreshMeetings, upsertMeeting]);

  const toggleAction = (index: number) => {
    const newSet = new Set(checkedActions);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setCheckedActions(newSet);
  };

  const handleShare = async () => {
    if (!summary) return;
    await exportTranscript(summary.title, {
      summary: summary.summary,
      transcript: rawTranscript,
      actionItems: summary.actionItems,
      keyDecisions: summary.keyDecisions,
      suggestions: summary.suggestions,
      date: new Date().toISOString()
    });
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const handleRename = () => {
    setRenameModalVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingOrb}>
           <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
        <Text variant="h2" style={{ marginTop: 24 }}>Synthesizing knowledge...</Text>
        <Text variant="body" muted style={{ marginTop: 8 }}>Extracting key insights and actions</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="h2" style={{ color: theme.colors.danger }}>Something went wrong</Text>
        <Text variant="body" muted style={{ marginTop: 8 }}>{error}</Text>
        <AnimatedPressable style={styles.backBtn} onPress={() => router.back()}>
           <Text variant="body" color={theme.colors.primary}>Go Back</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { justifyContent: 'space-between' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerIcon}>
            <MoreVertical size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Editorial Content Area */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text variant="display" style={[styles.editorialTitle, { color: theme.colors.text }]}>
             {summary?.title || 'Untitled Conversation'}
          </Text>
          
          {/* Document Meta Data */}
          <View style={styles.documentMeta}>
             <Clock size={16} color={theme.colors.textMuted} />
             <Text variant="caption" muted>{meetingDate}</Text>
             <Text variant="caption" muted>·</Text>
             <Badge source={badgeSource} />
          </View>

          {/* AI Executive Summary Block */}
          {summary?.summary && (
            <View style={[styles.editorialBlock, styles.calloutBlock, { backgroundColor: theme.colors.surfaceHighlight, borderLeftColor: theme.colors.primary }]}>
              <View style={styles.blockHeader}>
                 <Sparkles size={18} color={theme.colors.primary} />
                 <Text variant="h2" style={{ fontSize: 16 }}>Executive Summary</Text>
              </View>
              <Text variant="body" style={styles.proseText}>
                {summary.summary}
              </Text>
            </View>
          )}

          {/* Key Decisions */}
          {summary?.keyDecisions && summary.keyDecisions.length > 0 && (
            <View style={styles.editorialBlock}>
              <View style={styles.blockHeader}>
                 <CheckCircle2 size={18} color={theme.colors.purple} />
                 <Text variant="h2" style={{ fontSize: 18 }}>Key Decisions</Text>
              </View>
              {summary.keyDecisions.map((d, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: theme.colors.text }]} />
                  <Text variant="body" style={styles.proseText}>{d}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Items */}
          {summary?.actionItems && summary.actionItems.length > 0 && (
            <View style={styles.editorialBlock}>
              <View style={styles.blockHeader}>
                 <CheckSquare size={18} color={theme.colors.success} />
                 <Text variant="h2" style={{ fontSize: 18 }}>Action Items</Text>
              </View>
              {summary.actionItems.map((item, i) => {
                const isChecked = checkedActions.has(i);
                return (
                  <TouchableOpacity key={i} style={styles.taskRow} onPress={() => toggleAction(i)} activeOpacity={0.7}>
                    <View style={[styles.taskCheckbox, { borderColor: isChecked ? theme.colors.success : theme.colors.border, backgroundColor: isChecked ? theme.colors.success : 'transparent' }]}>
                      {isChecked && <CheckSquare size={14} color="#FFF" />}
                    </View>
                    <Text variant="body" style={[styles.proseText, { textDecorationLine: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.5 : 1 }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* AI Suggestions / Proactive Solutions */}
          {summary?.suggestions && summary.suggestions.length > 0 && (
            <View style={styles.editorialBlock}>
              <View style={styles.blockHeader}>
                 <Lightbulb size={18} color={theme.colors.warning} />
                 <Text variant="h2" style={{ fontSize: 18 }}>Proactive Suggestions</Text>
              </View>
              {summary.suggestions.map((s, i) => (
                <View key={i} style={[styles.suggestionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Text variant="body" style={styles.proseText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Transcript */}
          {rawTranscript && (
             <View style={[styles.editorialBlock, { marginTop: 40, paddingTop: 40, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
               <Text variant="h2" muted style={{ marginBottom: 24, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Full Transcript</Text>
               <Text variant="body" style={[styles.proseText, { color: theme.colors.textMuted }]}>
                 {rawTranscript}
               </Text>
             </View>
          )}

          {/* Bottom Padding for floating toolbar space removed */}
          <View style={{ height: 60 }} />
        </ScrollView>

        <ActionMenuModal 
          visible={menuVisible} 
          onClose={() => setMenuVisible(false)} 
          title={summary?.title || 'Meeting Options'}
          onRename={handleRename}
          onExport={handleShare}
          onDelete={handleDelete}
        />

        <ConfirmDeleteModal
          visible={deleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={async () => {
            if (meetingId) {
              // Navigate back instantly for premium feel
              router.back();
              await deleteMeeting(meetingId);
            }
          }}
        />

        <RenameModal
          visible={renameModalVisible}
          onClose={() => setRenameModalVisible(false)}
          initialName={summary?.title || 'Untitled Conversation'}
          onSave={async (newName) => {
            if (meetingId && newName.trim() && summary) {
              const success = await renameMeeting(meetingId, newName.trim());
              if (success) {
                setSummary({ ...summary, title: newName.trim() });
              }
            }
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingOrb: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  backBtn: { marginTop: 32, padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, height: 50 },
  headerIcon: { padding: 8 },
  
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, maxWidth: 800, alignSelf: 'center', width: '100%' },
  
  editorialTitle: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: 20,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 48,
  },
  
  editorialBlock: {
    marginBottom: 40,
  },
  calloutBlock: {
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  proseText: {
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 12, marginRight: 16, opacity: 0.5 },
  
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, paddingRight: 24 },
  taskCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, marginRight: 16, marginTop: 3, alignItems: 'center', justifyContent: 'center' },
  
  suggestionCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
});
