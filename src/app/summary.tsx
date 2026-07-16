import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { ArrowLeft, Share, Calendar, CheckSquare, AlignLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SummaryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Q3 Planning</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Share size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* AI Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AlignLeft size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>AI Summary</Text>
          </View>
          <Text style={styles.bodyText}>
            The team discussed the Q3 roadmap, focusing heavily on the mobile app redesign and backend scaling. Marketing budget was approved for a 15% increase, but the launch date for the new feature was pushed back to mid-August to accommodate QA testing.
          </Text>
        </View>

        {/* Action Items Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CheckSquare size={20} color={theme.colors.success} />
            <Text style={styles.cardTitle}>Action Items</Text>
          </View>
          
          <View style={styles.actionItem}>
            <View style={styles.checkbox} />
            <Text style={styles.bodyText}>Update the QA testing timeline by Friday (Sarah)</Text>
          </View>
          <View style={styles.actionItem}>
            <View style={styles.checkbox} />
            <Text style={styles.bodyText}>Finalize the Q3 marketing budget allocation (Mike)</Text>
          </View>
          <View style={styles.actionItem}>
            <View style={styles.checkbox} />
            <Text style={styles.bodyText}>Schedule a follow-up with the design team (You)</Text>
          </View>
        </View>

        {/* Transcript Snippet */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transcript Snippet</Text>
          <View style={styles.transcriptRow}>
            <Text style={styles.speakerText}>Sarah (10:04):</Text>
            <Text style={styles.transcriptText}>I think we need an extra two weeks for QA if we want to hit our stability metrics.</Text>
          </View>
          <View style={styles.transcriptRow}>
            <Text style={styles.speakerText}>Mike (10:05):</Text>
            <Text style={styles.transcriptText}>Agreed. Let's move the launch to mid-August. I'll adjust the marketing spend.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.exportButton}>
          <Calendar size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.exportButtonText}>Export to Calendar</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
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
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  bodyText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.textMuted,
    marginRight: 10,
    marginTop: 2,
  },
  transcriptRow: {
    marginBottom: 12,
  },
  speakerText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
