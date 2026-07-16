import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { theme } from '../theme';
import { Mic, CloudOff, Play, MoreVertical, Sparkles, AudioLines, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GlassCard } from '../components/glass-card';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const router = useRouter();

  // Animation values for breathing glow
  const glowScale1 = useSharedValue(1);
  const glowScale2 = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Start infinite breathing animation
    glowScale1.value = withRepeat(
      withTiming(1.3, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      true
    );
    glowScale2.value = withRepeat(
      withDelay(400, withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) })),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withTiming(0.1, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const animatedGlow1 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: glowScale1.value }],
      opacity: glowOpacity.value,
    };
  });

  const animatedGlow2 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: glowScale2.value }],
      opacity: glowOpacity.value * 0.7,
    };
  });

  return (
    <View style={styles.container}>
      {/* Background Mesh Gradient Orbs */}
      <View style={styles.meshOrb1} />
      <View style={styles.meshOrb2} />
      <View style={styles.meshOrb3} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Record</Text>
          <Text style={styles.subtitle}>AI Meeting Assistant Active</Text>
        </View>
        <View style={styles.badge}>
          <Sparkles size={14} color={theme.colors.primary} style={styles.badgeIcon} />
          <Text style={styles.badgeText}>Copilot On</Text>
        </View>
      </View>

      {/* Main Record Area */}
      <View style={styles.recordSection}>
        <View style={styles.recordButtonContainer}>
          {/* Breathing Orbs */}
          <Animated.View style={[
            styles.pulseRing, 
            animatedGlow1, 
            { backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.4)' : 'rgba(91, 95, 255, 0.2)' }
          ]} />
          <Animated.View style={[
            styles.pulseRing, 
            animatedGlow2, 
            { backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.3)' : 'rgba(124, 58, 237, 0.15)' }
          ]} />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setIsRecording(!isRecording)}
            style={styles.touchTarget}
          >
            <LinearGradient
              colors={isRecording ? ['#EF4444', '#B91C1C'] : ['#5B5FFF', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.recordButton}
            >
              {isRecording ? (
                <AudioLines size={44} color="#FFFFFF" />
              ) : (
                <Mic size={44} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={[styles.recordText, isRecording && styles.recordingActiveText]}>
          {isRecording ? '00:12:45' : 'Tap to Start'}
        </Text>
        <Text style={styles.recordingHint}>
          {isRecording ? 'AI is transcribing in real-time...' : 'Optimized for high-fidelity audio'}
        </Text>
      </View>

      {/* Category Selection Row */}
      <View style={styles.chipsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <TouchableOpacity style={[styles.chip, styles.chipActive]}>
            <Text style={[styles.chipText, styles.chipTextActive]}>Meeting</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>Lecture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>Interview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>Brainstorm</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Recent List */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Meetings</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
          <GlassCard
            title="Q3 Planning Meeting"
            subtitle="Today, 10:00 AM • 45 min"
            icon={<Play size={20} color={theme.colors.primary} />}
            rightElement={
              <TouchableOpacity style={styles.moreButton}>
                <MoreVertical size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            }
            style={styles.recentCard}
            onPress={() => router.push('/summary')}
          />
          
          <GlassCard
            title="Client Sync: Techvera"
            subtitle="Yesterday, 2:30 PM • 30 min"
            icon={<Play size={20} color={theme.colors.primary} />}
            rightElement={
              <TouchableOpacity style={styles.moreButton}>
                <MoreVertical size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            }
            style={styles.recentCard}
            onPress={() => router.push('/summary')}
          />
        </ScrollView>
      </View>
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
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(91, 95, 255, 0.08)',
    filter: 'blur(80px)',
  },
  meshOrb2: {
    position: 'absolute',
    top: 150,
    right: -150,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(124, 92, 246, 0.06)',
    filter: 'blur(100px)',
  },
  meshOrb3: {
    position: 'absolute',
    bottom: -100,
    left: 20,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    filter: 'blur(90px)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91, 95, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(91, 95, 255, 0.15)',
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    color: '#5B5FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  recordSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
  },
  touchTarget: {
    zIndex: 10,
  },
  recordButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#5B5FFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  recordText: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  recordingActiveText: {
    color: '#EF4444',
  },
  recordingHint: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
    marginTop: 6,
  },
  chipsSection: {
    marginBottom: 24,
  },
  chipsScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  chipActive: {
    backgroundColor: '#5B5FFF',
    borderColor: '#5B5FFF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 14,
    letterSpacing: -0.25,
  },
  recentScroll: {
    paddingBottom: 110, // Avoid overlapping floating tab bar
  },
  recentCard: {
    marginBottom: 12,
  },
  moreButton: {
    padding: 4,
  },
});
