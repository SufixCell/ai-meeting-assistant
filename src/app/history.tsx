import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Play, MoreVertical, Calendar, Clock, FileText, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const RECORDINGS = [
  {
    id: '1',
    title: 'Q3 Planning Meeting',
    date: 'Today, 10:00 AM',
    duration: '45 min',
    status: 'summarized',
  },
  {
    id: '2',
    title: 'Client Sync: Techvera',
    date: 'Yesterday, 2:30 PM',
    duration: '30 min',
    status: 'summarized',
  },
  {
    id: '3',
    title: 'Weekly Standup',
    date: 'Oct 24, 9:15 AM',
    duration: '15 min',
    status: 'processing',
  }
];

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {RECORDINGS.map((recording) => (
          <TouchableOpacity 
            key={recording.id} 
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push('/summary')}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <FileText size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>{recording.title}</Text>
              </View>
              <TouchableOpacity>
                <MoreVertical size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Calendar size={14} color={theme.colors.textMuted} />
                <Text style={styles.metaText}>{recording.date}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Clock size={14} color={theme.colors.textMuted} />
                <Text style={styles.metaText}>{recording.duration}</Text>
              </View>
            </View>

            <View style={[styles.statusBadge, recording.status === 'processing' && styles.statusBadgeProcessing]}>
              {recording.status === 'summarized' ? (
                <CheckCircle2 size={14} color={theme.colors.success} style={{ marginRight: 4 }} />
              ) : (
                <View style={styles.processingDot} />
              )}
              <Text style={[styles.statusText, recording.status === 'processing' && styles.statusTextProcessing]}>
                {recording.status === 'summarized' ? 'Summary Ready' : 'Processing...'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100, // For bottom tabs
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  metaText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusBadgeProcessing: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  statusText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextProcessing: {
    color: theme.colors.primary,
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: 6,
  }
});
