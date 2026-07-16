import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Star, ShieldCheck, ChevronRight, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subscription / Paywall Banner */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumCard}
        >
          <View style={styles.premiumHeader}>
            <Star size={24} color="#FFD700" fill="#FFD700" />
            <Text style={styles.premiumTitle}>Upgrade to Pro</Text>
          </View>
          
          <Text style={styles.premiumBody}>
            Get unlimited local recordings, speaker identification, and custom summary templates.
          </Text>

          <View style={styles.featureRow}>
            <ShieldCheck size={16} color="#FFF" />
            <Text style={styles.featureText}>No hidden bots, 100% private</Text>
          </View>
          <View style={styles.featureRow}>
            <Zap size={16} color="#FFF" />
            <Text style={styles.featureText}>Unlimited fast AI summaries</Text>
          </View>

          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Start 7-Day Free Trial</Text>
          </TouchableOpacity>
          <Text style={styles.priceText}>Then $9.99/mo. Cancel anytime.</Text>
        </LinearGradient>

        {/* General Settings List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <TouchableOpacity style={styles.listItem}>
            <Text style={styles.listText}>Account & Sync</Text>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.listItem}>
            <Text style={styles.listText}>Default Export Format</Text>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.listItem}>
            <Text style={styles.listText}>Audio Quality</Text>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.listItem}>
            <Text style={styles.listText}>Help Center & FAQ</Text>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.listItem}>
            <Text style={styles.listText}>Contact Real Human Support</Text>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
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
  premiumCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  premiumBody: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#FFF',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  upgradeButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '700',
  },
  priceText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  listSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
});
