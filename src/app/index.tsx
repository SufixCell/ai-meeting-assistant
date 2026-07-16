import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme';
import { Mic, CloudOff, Play, MoreVertical } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Recording</Text>
        <View style={styles.badge}>
          <CloudOff size={14} color={theme.colors.success} style={styles.badgeIcon} />
          <Text style={styles.badgeText}>Saved Locally</Text>
        </View>
      </View>

      <View style={styles.recordSection}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsRecording(!isRecording)}
          style={styles.recordButtonContainer}
        >
          {isRecording && (
            <View style={[styles.pulseRing, styles.pulse1]} />
          )}
          {isRecording && (
            <View style={[styles.pulseRing, styles.pulse2]} />
          )}
          <LinearGradient
            colors={isRecording ? [theme.colors.danger, '#B91C1C'] : [theme.colors.primary, '#4338CA']}
            style={styles.recordButton}
          >
            <Mic size={48} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.recordText}>
          {isRecording ? '00:12:45' : 'Tap to Record'}
        </Text>
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Play size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Q3 Planning Meeting</Text>
              <Text style={styles.cardSubtitle}>Today, 10:00 AM • 45 min</Text>
            </View>
            <TouchableOpacity>
              <MoreVertical size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Play size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Client Sync: Techvera</Text>
              <Text style={styles.cardSubtitle}>Yesterday, 2:30 PM • 30 min</Text>
            </View>
            <TouchableOpacity>
              <MoreVertical size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  recordSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  pulse1: {
    transform: [{ scale: 1.2 }],
  },
  pulse2: {
    transform: [{ scale: 1.4 }],
    opacity: 0.5,
  },
  recordText: {
    marginTop: theme.spacing.lg,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});
