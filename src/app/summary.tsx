import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { ArrowLeft, Share, Calendar, CheckSquare, AlignLeft, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function SummaryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background Mesh Gradient Orbs */}
      <View style={styles.meshOrb1} />
      <View style={styles.meshOrb2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Q3 Planning</Text>
        <TouchableOpacity style={styles.iconButton}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <Share size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* AI Summary Card */}
        <View style={styles.card}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#5B5FFF', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrapper}
            >
              <Sparkles size={16} color="#FFF" />
            </LinearGradient>
            <Text style={styles.cardTitle}>AI Executive Summary</Text>
          </View>
          <Text style={styles.bodyText}>
            The team aligned on the Q3 roadmap, prioritizing the mobile app redesign and backend database scaling. The Q3 marketing budget was approved for a 15% increase. However, the official launch timeline for the new features was adjusted to mid-August to accommodate thorough QA stability testing.
          </Text>
        </View>

        {/* Action Items Card */}
        <View style={styles.card}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#10B981', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrapper}
            >
              <CheckSquare size={16} color="#FFF" />
            </LinearGradient>
            <Text style={styles.cardTitle}>Action Items</Text>
          </View>
          
          <View style={styles.actionItem}>
            <View style={[styles.checkbox, styles.checkboxActive]}>
              <CheckCircle2 size={16} color={theme.colors.success} />
            </View>
            <Text style={styles.actionBodyText}>Update the QA testing timeline by Friday (Sarah)</Text>
          </View>
          <View style={styles.actionItem}>
            <View style={styles.checkbox}>
              <View style={styles.checkboxInner} />
            </View>
            <Text style={styles.actionBodyText}>Finalize the Q3 marketing budget allocation (Mike)</Text>
          </View>
          <View style={styles.actionItem}>
            <View style={styles.checkbox}>
              <View style={styles.checkboxInner} />
            </View>
            <Text style={styles.actionBodyText}>Schedule a follow-up with the design team (You)</Text>
          </View>
        </View>

        {/* Transcript Snippet */}
        <View style={styles.card}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#7C3AED', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrapper}
            >
              <AlignLeft size={16} color="#FFF" />
            </LinearGradient>
            <Text style={styles.cardTitle}>Key Transcript Snippet</Text>
          </View>
          <View style={styles.transcriptRow}>
            <Text style={styles.speakerText}>Sarah (10:04):</Text>
            <Text style={styles.transcriptText}>I think we need an extra two weeks for QA if we want to hit our stability metrics.</Text>
          </View>
          <View style={styles.transcriptRow}>
            <Text style={styles.speakerText}>Mike (10:05):</Text>
            <Text style={styles.transcriptText}>Agreed. Let\'s move the launch to mid-August. I\'ll adjust the marketing spend.</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.exportButton}>
          <LinearGradient
            colors={['#5B5FFF', '#7C3AED']}
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
    backgroundColor: '#F8FAFC',
    paddingTop: 60,
  },
  meshOrb1: {
    position: 'absolute',
    top: -50,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(91, 95, 255, 0.05)',
    filter: 'blur(90px)',
  },
  meshOrb2: {
    position: 'absolute',
    bottom: 50,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0F172A',
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
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
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
    color: '#0F172A',
    marginLeft: 10,
    letterSpacing: -0.25,
  },
  bodyText: {
    fontSize: 15,
    color: '#475569',
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
    borderColor: '#94A3B8',
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
    color: '#475569',
    lineHeight: 20,
    fontWeight: '400',
    flex: 1,
  },
  transcriptRow: {
    marginBottom: 14,
    borderLeftWidth: 2,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 12,
  },
  speakerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B5FFF',
    marginBottom: 2,
  },
  transcriptText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '400',
  },
  exportButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#5B5FFF',
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
