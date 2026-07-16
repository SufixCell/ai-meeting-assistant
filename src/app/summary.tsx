import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import { ArrowLeft, Share, Calendar, CheckSquare, AlignLeft, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();

  const transcript = params.transcript as string || "";

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Background Mesh Gradient Orbs */}
      <View style={[styles.meshOrb1, { backgroundColor: theme.colors.primaryGlow }]} />
      <View style={[styles.meshOrb2, { backgroundColor: theme.colors.danger + '20' }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
          <BlurView intensity={theme.name === 'arctic' ? 50 : 20} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Q3 Planning</Text>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
          <BlurView intensity={theme.name === 'arctic' ? 50 : 20} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
          <Share size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* AI Summary Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <BlurView intensity={theme.name === 'arctic' ? 40 : 10} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrapper}
            >
              <Sparkles size={16} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>AI Executive Summary</Text>
          </View>
          <Text style={[styles.bodyText, { color: theme.colors.textMuted }]}>
            The team aligned on the Q3 roadmap, prioritizing the mobile app redesign and backend database scaling. The Q3 marketing budget was approved for a 15% increase. However, the official launch timeline for the new features was adjusted to mid-August to accommodate thorough QA stability testing.
          </Text>
        </View>

        {/* Action Items Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <BlurView intensity={theme.name === 'arctic' ? 40 : 10} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[theme.colors.success, '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrapper}
            >
              <CheckSquare size={16} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Action Items</Text>
          </View>
          
          <View style={styles.actionItem}>
            <View style={[styles.checkbox, styles.checkboxActive]}>
              <CheckCircle2 size={16} color={theme.colors.success} />
            </View>
            <Text style={[styles.actionBodyText, { color: theme.colors.text }]}>Update the QA testing timeline by Friday (Sarah)</Text>
          </View>
          <View style={styles.actionItem}>
            <View style={[styles.checkbox, { borderColor: theme.colors.textMuted }]}>
              <View style={styles.checkboxInner} />
            </View>
            <Text style={[styles.actionBodyText, { color: theme.colors.text }]}>Finalize the Q3 marketing budget allocation (Mike)</Text>
          </View>
          <View style={styles.actionItem}>
            <View style={[styles.checkbox, { borderColor: theme.colors.textMuted }]}>
              <View style={styles.checkboxInner} />
            </View>
            <Text style={[styles.actionBodyText, { color: theme.colors.text }]}>Schedule a follow-up with the design team (You)</Text>
          </View>
        </View>

        {/* Transcript Snippet */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <BlurView intensity={theme.name === 'arctic' ? 40 : 10} tint={theme.name === 'arctic' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[theme.colors.purple, '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrapper}
            >
              <AlignLeft size={16} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Full Transcript</Text>
          </View>
          {transcript ? (
            <View style={[styles.transcriptRow, { borderLeftColor: theme.colors.border }]}>
              <Text style={[styles.speakerText, { color: theme.colors.primary }]}>You:</Text>
              <Text style={[styles.transcriptText, { color: theme.colors.textMuted }]}>{transcript}</Text>
            </View>
          ) : (
            <>
              <View style={[styles.transcriptRow, { borderLeftColor: theme.colors.border }]}>
                <Text style={[styles.speakerText, { color: theme.colors.primary }]}>Sarah (10:04):</Text>
                <Text style={[styles.transcriptText, { color: theme.colors.textMuted }]}>I think we need an extra two weeks for QA if we want to hit our stability metrics.</Text>
              </View>
              <View style={[styles.transcriptRow, { borderLeftColor: theme.colors.border }]}>
                <Text style={[styles.speakerText, { color: theme.colors.primary }]}>Mike (10:05):</Text>
                <Text style={[styles.transcriptText, { color: theme.colors.textMuted }]}>Agreed. Let's move the launch to mid-August. I'll adjust the marketing spend.</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity activeOpacity={0.8} style={[styles.exportButton, { shadowColor: theme.colors.primary }]}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exportGradient}
          >
            <Calendar size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.exportButtonText}>Export to Calendar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  meshOrb1: {
    position: 'absolute',
    top: -50,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    filter: 'blur(90px)',
  },
  meshOrb2: {
    position: 'absolute',
    bottom: 50,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    filter: 'blur(80px)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    letterSpacing: -0.25,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: 'transparent',
    borderWidth: 0,
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  actionBodyText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    flex: 1,
  },
  transcriptRow: {
    marginBottom: 14,
    borderLeftWidth: 2,
    paddingLeft: 12,
  },
  speakerText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  exportButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  exportGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
