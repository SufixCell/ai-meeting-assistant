import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface TranscriptTabProps {
  transcript: string;
}

export function TranscriptTab({ transcript }: TranscriptTabProps) {
  const { theme } = useTheme();

  const wordCount = transcript
    ? transcript.trim().split(/\s+/).filter(Boolean).length
    : 0;

  if (!transcript || transcript.trim().length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          No transcript available for this meeting.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.wordCount, { color: theme.colors.textMuted }]}>
        ~{wordCount.toLocaleString()} words
      </Text>

      <View
        style={[
          styles.transcriptBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.transcriptText, { color: theme.colors.text }]}>
          {transcript}
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  wordCount: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  transcriptBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
});
