import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { MoreVertical, Calendar, Clock, Users, ChevronRight, Sparkles, AudioLines, Mic } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { GlassCard } from '../components/glass-card';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSkeleton } from '../components/loading-skeleton';

const RECORDINGS = [
  {
    id: '1',
    title: 'Q3 Planning Meeting',
    date: 'Today, 10:00 AM',
    duration: '45 min',
    speakers: '4 speakers',
    status: 'summarized',
  },
  {
    id: '2',
    title: 'Client Sync: Techvera',
    date: 'Yesterday, 2:30 PM',
    duration: '30 min',
    speakers: '3 speakers',
    status: 'summarized',
  },
  {
    id: '3',
    title: 'Weekly Standup',
    date: 'Oct 24, 9:15 AM',
    duration: '15 min',
    speakers: '6 speakers',
    status: 'processing',
  },
  {
    id: '4',
    title: 'Design Review: Dashboard',
    date: 'Oct 22, 11:00 AM',
    duration: '12 min',
    speakers: '2 speakers',
    status: 'recording',
  }
];

export default function HistoryScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Status badging helpers
  const getBadgeType = (status: string): 'success' | 'processing' | 'danger' | 'default' => {
    if (status === 'summarized') return 'success';
    if (status === 'processing') return 'processing';
    if (status === 'recording') return 'danger';
    return 'default';
  };

  const getBadgeText = (status: string) => {
    if (status === 'summarized') return 'AI Summary Ready';
    if (status === 'processing') return 'Transcribing...';
    if (status === 'recording') return 'Recording Live';
    return 'Saved';
  };

  const getIconContainer = (status: string) => {
    const colors = (status === 'recording' 
      ? ['#EF4444', '#DC2626'] 
      : status === 'processing'
        ? ['#7C3AED', '#5B5FFF']
        : ['#5B5FFF', '#38BDF8']) as readonly [string, string, ...string[]];

    return (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconGradient}
      >
        {status === 'recording' ? (
          <AudioLines size={18} color="#FFFFFF" />
        ) : (
          <Mic size={18} color="#FFFFFF" />
        )}
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Mesh Gradient Orbs */}
      <View style={styles.meshOrb1} />
      <View style={styles.meshOrb2} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>All your AI meeting intel in one place</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {RECORDINGS.map((recording) => (
          <GlassCard
            key={recording.id}
            title={recording.title}
            badgeText={getBadgeText(recording.status)}
            badgeType={getBadgeType(recording.status)}
            icon={getIconContainer(recording.status)}
            rightElement={
              <TouchableOpacity style={styles.moreButton}>
                <MoreVertical size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            }
            metaBadges={[
              {
                icon: <Calendar size={14} color={theme.colors.textMuted} />,
                text: recording.date,
              },
              {
                icon: <Clock size={14} color={theme.colors.textMuted} />,
                text: recording.duration,
              },
              {
                icon: <Users size={14} color={theme.colors.textMuted} />,
                text: recording.speakers,
              }
            ]}
            style={styles.cardSpacing}
            onPress={() => router.push('/summary')}
          >
            {/* Quick action drawer row inside the GlassCard */}
            <View style={styles.actionDrawer}>
              <View style={styles.actionContent}>
                <Sparkles size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.actionText}>
                  {recording.status === 'summarized' 
                    ? 'Quick Actions: View Summary, Actions' 
                    : recording.status === 'processing'
                      ? 'AI summary generating in real-time...'
                      : 'Live audio stream active'}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textMuted} />
            </View>
          </GlassCard>
        ))}
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
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    filter: 'blur(90px)',
  },
  meshOrb2: {
    position: 'absolute',
    bottom: 100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(91, 95, 255, 0.05)',
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
    paddingBottom: 110, // Avoid overlapping floating tab bar
  },
  cardSpacing: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    padding: 4,
  },
  actionDrawer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
});
