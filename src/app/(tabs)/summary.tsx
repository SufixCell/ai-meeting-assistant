import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { ArrowLeft, Share, Calendar, CheckSquare, AlignLeft, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { generateMeetingSummary, type MeetingSummary } from '../../lib/groq';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [rawTranscript, setRawTranscript] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        const meetingId = params.meetingId as string;

        // If viewing an existing meeting from history
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
            });
          }
          setLoading(false);
          return;
        }

        // Otherwise, generate a new summary from the passed transcript
        const transcript = (params.transcript as string) || '';
        setRawTranscript(transcript);

        if (!transcript || transcript.trim().length < 5) {
          setSummary({
            title: 'Recording',
            summary: 'No speech was captured. Make sure your microphone is allowed and speak clearly.',
            actionItems: [],
            keyDecisions: [],
          });
          setLoading(false);
          return;
        }

        const result = await generateMeetingSummary(transcript);
        setSummary(result);

        // Save to Supabase history
        if (user && !saved) {
          setSaved(true);
          await supabase.from('meetings').insert({
            user_id: user.id,
            title: result.title,
            transcript: transcript,
            summary: result.summary,
            action_items: result.actionItems,
            key_decisions: result.keyDecisions,
          });
        }
      } catch (err: any) {
        console.error('Summary error:', err);
        setError(err.message || 'Failed to load summary');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* Clean Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}
        >
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {loading ? 'Generating...' : (summary?.title || 'Meeting Summary')}
        </Text>

        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}
        >
          <Share size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingTitle, { color: theme.colors.text }]}>AI is analysing…</Text>
          <Text style={[styles.loadingSub, { color: theme.colors.textMuted }]}>Powered by Groq llama-3.3-70b</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.centered}>
          <Text style={[styles.loadingTitle, { color: theme.colors.danger }]}>Something went wrong</Text>
          <Text style={[styles.loadingSub, { color: theme.colors.textMuted }]}>{error}</Text>
        </View>
      )}

      {/* Content */}
      {!loading && !error && summary && (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* AI Summary */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <BlurView intensity={theme.name === 'arctic' ? 40 : 10} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
            <View style={styles.cardHeader}>
              <LinearGradient colors={[theme.colors.primary, theme.colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrap}>
                <Sparkles size={16} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>AI Executive Summary</Text>
            </View>
            <Text style={[styles.bodyText, { color: theme.colors.textMuted }]}>{summary.summary}</Text>
          </View>

          {/* Action Items */}
          {summary.actionItems.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <BlurView intensity={theme.name === 'arctic' ? 40 : 10} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
              <View style={styles.cardHeader}>
                <LinearGradient colors={[theme.colors.success, '#38BDF8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrap}>
                  <CheckSquare size={16} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Action Items</Text>
              </View>
              {summary.actionItems.map((item, i) => (
                <View key={i} style={styles.listRow}>
                  <View style={[styles.checkbox, { borderColor: theme.colors.textMuted }]} />
                  <Text style={[styles.listText, { color: theme.colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Key Decisions */}
          {summary.keyDecisions.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <BlurView intensity={theme.name === 'arctic' ? 40 : 10} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
              <View style={styles.cardHeader}>
                <LinearGradient colors={[theme.colors.purple, theme.colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrap}>
                  <CheckCircle2 size={16} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Key Decisions</Text>
              </View>
              {summary.keyDecisions.map((d, i) => (
                <View key={i} style={styles.listRow}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={[styles.listText, { color: theme.colors.text }]}>{d}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Full Transcript */}
          {rawTranscript.trim().length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <BlurView intensity={theme.name === 'arctic' ? 40 : 10} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
              <View style={styles.cardHeader}>
                <LinearGradient colors={[theme.colors.purple, '#38BDF8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrap}>
                  <AlignLeft size={16} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Full Transcript</Text>
              </View>
              <View style={[styles.transcriptBox, { borderLeftColor: theme.colors.primary }]}>
                <Text style={[styles.transcriptText, { color: theme.colors.textMuted }]}>{rawTranscript}</Text>
              </View>
            </View>
          )}

          {/* Export Button */}
          <TouchableOpacity activeOpacity={0.85} style={styles.exportBtn}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.exportGradient}>
              <Calendar size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.exportText}>Export to Calendar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
    letterSpacing: -0.2,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    marginRight: 10,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 6,
  },
  listText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  transcriptBox: {
    borderLeftWidth: 2,
    paddingLeft: 12,
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 22,
  },
  exportBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  exportGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
