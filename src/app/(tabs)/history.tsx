import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { FileText, Calendar, Search, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('meetings').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setMeetings(data);
        setLoading(false);
      });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primaryGlow, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>History</Text>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
          <Search size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {meetings.map((meeting) => (
            <TouchableOpacity 
              key={meeting.id} 
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => router.push({ pathname: '/summary', params: { meetingId: meeting.id } })}
            >
              <View style={[styles.iconWrapper, { backgroundColor: theme.colors.surfaceHighlight }]}>
                <FileText size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>{meeting.title}</Text>
                <View style={styles.meta}>
                  <Calendar size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.date, { color: theme.colors.textMuted }]}>
                    {new Date(meeting.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 13,
  },
});
