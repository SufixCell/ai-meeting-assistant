import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Star, ShieldCheck, ChevronRight, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      {/* Background Mesh Gradient Orbs */}
      <View style={styles.meshOrb1} />
      <View style={styles.meshOrb2} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure your AI workflows</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subscription / Paywall Banner */}
        <LinearGradient
          colors={['#5B5FFF', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumCard}
        >
          <View style={styles.premiumHeader}>
            <Star size={22} color="#FFD700" fill="#FFD700" />
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

          <TouchableOpacity activeOpacity={0.9} style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Start 7-Day Free Trial</Text>
          </TouchableOpacity>
          <Text style={styles.priceText}>Then $9.99/mo. Cancel anytime.</Text>
        </LinearGradient>

        {/* General Settings List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <TouchableOpacity style={styles.listItem}>
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.listText}>Account & Sync</Text>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.listItem}>
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.listText}>Default Export Format</Text>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.listItem}>
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.listText}>Audio Quality</Text>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.listItem}>
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.listText}>Help Center & FAQ</Text>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.listItem}>
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.listText}>Contact Real Human Support</Text>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
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
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(91, 95, 255, 0.04)',
    filter: 'blur(90px)',
  },
  meshOrb2: {
    position: 'absolute',
    bottom: 100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.04)',
    filter: 'blur(80px)',
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.75,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 110, // For bottom tabs
  },
  premiumCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#5B5FFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
    letterSpacing: -0.25,
  },
  premiumBody: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '400',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#FFF',
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '400',
  },
  upgradeButton: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
  },
  upgradeButtonText: {
    color: '#5B5FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  priceText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '400',
  },
  listSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.25,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  listText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '400',
  },
});
