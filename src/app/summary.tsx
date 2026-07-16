import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { ArrowLeft, Share, Calendar, CheckSquare, AlignLeft, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { generateMeetingSummary, type MeetingSummary } from '../lib/groq';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [rawTranscript, setRawTranscript] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        const transcript = (params.transcript as string) || '';
        setRawTranscript(transcript);

        if (!transcript || transcript.trim().length < 5) {
          setSummary({
            title: 'Recording',
            summary: 'No speech was captured. Please make sure your microphone is allowed and try again.',
            actionItems: [],
            keyDecisions: [],
          });
          setLoading(false);
          return;
        }

        // Call Groq to generate real AI summary
        const result = await generateMeetingSummary(transcript);
        setSummary(result);

        // Save to Supabase
        if (user) {
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
        console.error('Summary generation error:', err);
        setError(err.message || 'Failed to generate summary');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.meshOrb1, { backgroundColor: theme.colors.primaryGlow }]} />
      <View style={[styles.meshOrb2, { backgroundColor: theme.colors.danger + '20' }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}
        >
          <BlurView intensity={theme.name === 'arctic' ? 50 : 20} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {loading ? 'Generating...' : (summary?.title || 'Meeting Summary')}
        </Text>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
          <BlurView intensity={theme.name === 'arctic' ? 50 : 20} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
          <Share size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            AI is analysing your meeting...
          </Text>
          <Text style={[styles.loadingSubText, { color: theme.colors.textMuted }]}>
            Groq llama-3.3-70b is generating your summary
          </Text>
        </View>
      )}

      {/* Error State */}
      {!loading && error && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.danger }]}>⚠️ Error</Text>
          <Text style={[styles.loadingSubText, { color: theme.colors.textMuted }]}>{error}</Text>
          <Text style={[styles.loadingSubText, { color: theme.colors.textMuted, marginTop: 8 }]}>
            Check that your Groq API key is valid in .env
          </Text>
        </View>
      )}

      {/* Summary Content */}
      {!loading && !error && summary && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* AI Summary Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <BlurView intensity={theme.name === 'arctic' ? 40 : 10} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
            <View style={styles.cardHeader}>
              <LinearGradient colors={[theme.colors.primary, theme.colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrapper}>
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
                <LinearGradient colors={[theme.colors.success, '#38BDF8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrapper}>
                  <CheckSquare size={16} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Action Items</Text>
              </View>
              {summary.actionItems.map((item, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={[styles.checkbox, { borderColor: theme.colors.textMuted }]} />
                  <Text style={[styles.actionBodyText, { color: theme.colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Key Decisions */}
          {summary.keyDecisions.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <BlurView intensity={theme.name === 'arctic' ? 40 : 10} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
              <View style={styles.cardHeader}>
                <LinearGradient colors={[theme.colors.purple, theme.colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrapper}>
                  <CheckCircle2 size={16} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Key Decisions</Text>
              </View>
              {summary.keyDecisions.map((decision, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={[styles.decisionDot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={[styles.actionBodyText, { color: theme.colors.text }]}>{decision}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Full Transcript */}
          {rawTranscript.trim().length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <BlurView intensity={theme.name === 'arctic' ? 40 : 10} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
              <View style={styles.cardHeader}>
                <LinearGradient colors={[theme.colors.purple, '#38BDF8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrapper}>
                  <AlignLeft size={16} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Full Transcript</Text>
              </View>
              <View style={[styles.transcriptRow, { borderLeftColor: theme.colors.primary }]}>
                <Text style={[styles.transcriptText, { color: theme.colors.textMuted }]}>{rawTranscript}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity activeOpacity={0.8} style={[styles.exportButton, { shadowColor: theme.colors.primary }]}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.exportGradient}>
              <Calendar size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.exportButtonText}>Export to Calendar</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  meshOrb1: { position: 'absolute', top: -50, left: -100, width: 320, height: 320, borderRadius: 160 },
  meshOrb2: { position: 'absolute', bottom: 50, right: -100, width: 300, height: 300, borderRadius: 150 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  iconButton: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, borderWidth: 1, overflow: 'hidden',
  },
  title: { fontSize: 20, fontWeight: '600', letterSpacing: -0.5, flex: 1, textAlign: 'center', marginHorizontal: 12 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: { fontSize: 20, fontWeight: '700', marginTop: 20, textAlign: 'center' },
  loadingSubText: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  card: {
    borderRadius: 24, padding: 20, marginBottom: 16,
    borderWidth: 1, overflow: 'hidden', elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconWrapper: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '600', marginLeft: 10, letterSpacing: -0.25 },
  bodyText: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  actionItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, marginRight: 12, marginTop: 2 },
  decisionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, marginTop: 7 },
  actionBodyText: { fontSize: 14, lineHeight: 20, flex: 1 },
  transcriptRow: { borderLeftWidth: 2, paddingLeft: 12 },
  transcriptText: { fontSize: 14, lineHeight: 22 },
  exportButton: { borderRadius: 16, overflow: 'hidden', marginTop: 10, elevation: 4, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
  exportGradient: { flexDirection: 'row', paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  exportButtonText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
});
