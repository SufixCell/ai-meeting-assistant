import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Badge } from '../ui/Badge';

interface Metadata {
  date: string;
  duration?: string;
  source?: string;
  platform?: string;
}

interface SummaryTabProps {
  summary: string;
  keyDecisions: string[];
  metadata: Metadata;
}

export function SummaryTab({ summary, keyDecisions, metadata }: SummaryTabProps) {
  const { theme } = useTheme();

  const badgeSource = (metadata.platform as any) || (metadata.source as any) || 'mic';

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Metadata row */}
      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
          {metadata.date}
          {metadata.duration ? `  ·  ${metadata.duration}` : ''}
        </Text>
        <View style={{ marginLeft: 8 }}>
          <Badge source={badgeSource} size="sm" />
        </View>
      </View>

      {/* AI Summary */}
      <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>AI SUMMARY</Text>
      <View style={[styles.summaryBox, { borderLeftColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.summaryText, { color: theme.colors.text }]}>
          {summary || 'No summary available.'}
        </Text>
      </View>

      {/* Key Decisions */}
      {keyDecisions.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>KEY DECISIONS</Text>
          <View style={[styles.decisionsBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {keyDecisions.map((decision, i) => (
              <View key={i} style={styles.decisionRow}>
                <Text style={[styles.bullet, { color: theme.colors.primary }]}>▸</Text>
                <Text style={[styles.decisionText, { color: theme.colors.text }]}>{decision}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  metaText: {
    fontSize: 13,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  summaryBox: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    paddingVertical: 12,
    paddingRight: 12,
    borderRadius: 2,
    marginBottom: 24,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
  },
  decisionsBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 24,
    gap: 10,
  },
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    fontSize: 14,
    marginTop: 2,
  },
  decisionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
