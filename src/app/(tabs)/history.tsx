import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { FileText, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { SearchBar } from '../../components/ui/SearchBar';
import { MeetingListItem } from '../../components/ui/MeetingListItem';
import { EmptyState } from '../../components/ui/EmptyState';
import { useMeetings } from '../../contexts/MeetingsContext';

type Filter = 'all' | 'mic' | 'zoom' | 'meet' | 'teams';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mic', label: 'Mic' },
  { key: 'zoom', label: 'Zoom' },
  { key: 'meet', label: 'Meet' },
  { key: 'teams', label: 'Teams' },
];

let notebookRenderCount = 0;

export default function NotebookScreen() {
  notebookRenderCount++;
  console.log(`[PIPELINE] Notebook render count: ${notebookRenderCount}`);
  const { theme } = useTheme();
  const router = useRouter();
  const { meetings, loading, refreshMeetings } = useMeetings();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMeetings();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let list = meetings;
    if (filter !== 'all') {
      list = list.filter(m => {
        if (filter === 'mic') return !m.source || m.source === 'mic';
        if (filter === 'meet') return m.platform === 'meet' || m.platform === 'google_meet';
        return m.platform === filter;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        m.summary?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [meetings, filter, search]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primaryGlow, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Notebook</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search meetings, transcripts…"
          />
        </View>

        {/* Filter chips */}
        <View style={styles.filtersRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: filter === f.key ? theme.colors.primary : theme.colors.surface,
                  borderColor: filter === f.key ? theme.colors.primary : theme.colors.border,
                }
              ]}
            >
              <Text style={[styles.chipText, { color: filter === f.key ? '#FFF' : theme.colors.textMuted }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={theme.colors.primary} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MeetingListItem
                meeting={item}
                onPress={() => router.push({ pathname: '/(tabs)/summary', params: { meetingId: item.id } })}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon={<FileText size={28} color={theme.colors.textMuted} />}
                title={search ? 'No results' : 'No meetings yet'}
                subtitle={
                  search
                    ? 'Try a different search term or clear the filter'
                    : 'Tap Record or Join to capture your first meeting'
                }
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  filtersRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
});
