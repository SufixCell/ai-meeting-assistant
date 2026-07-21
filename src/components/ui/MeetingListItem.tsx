import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ChevronRight, Calendar, Clock, CheckCircle2, CircleDashed } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { AnimatedPressable } from '../animated-pressable';
import { Text } from './Text';

interface MeetingListItemProps {
  meeting: any;
  onPress: () => void;
}

export function MeetingListItem({ meeting, onPress }: MeetingListItemProps) {
  const { theme } = useTheme();

  const createdDate = new Date(meeting.created_at);
  const dateStr = createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = createdDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  
  const duration = meeting.duration_seconds
    ? `${Math.round(meeting.duration_seconds / 60)}m`
    : '';

  const hasTasks = meeting.action_items && meeting.action_items.length > 0;
  const taskCount = hasTasks ? meeting.action_items.length : 0;
  const isProcessed = !!meeting.transcript; // Assuming transcript presence means processed

  // Smart fallback titles
  let displayTitle = meeting.title;
  if (!displayTitle || displayTitle.toLowerCase().includes('no discussion') || displayTitle === 'Untitled Meeting') {
    displayTitle = meeting.source === 'bot' 
      ? `Meeting — ${dateStr}` 
      : `Recording — ${timeStr}`;
  }

  return (
    <AnimatedPressable
      scaleTo={0.98}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {displayTitle}
        </Text>
        
        <View style={styles.metadataRow}>
          <View style={styles.metaGroup}>
            <Calendar size={12} color={theme.colors.textMuted} />
            <Text variant="caption" muted style={styles.metaText}>{dateStr}</Text>
          </View>

          {duration ? (
            <>
              <Text variant="caption" muted style={styles.metaDot}>•</Text>
              <View style={styles.metaGroup}>
                <Clock size={12} color={theme.colors.textMuted} />
                <Text variant="caption" muted style={styles.metaText}>{duration}</Text>
              </View>
            </>
          ) : null}

          {taskCount > 0 ? (
            <>
              <Text variant="caption" muted style={styles.metaDot}>•</Text>
              <View style={styles.metaGroup}>
                <Text variant="caption" style={[styles.metaText, { color: theme.colors.primary }]}>
                  {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                </Text>
              </View>
            </>
          ) : null}

          <Text variant="caption" muted style={styles.metaDot}>•</Text>
          <View style={styles.metaGroup}>
            {isProcessed ? (
              <CheckCircle2 size={12} color={theme.colors.success} />
            ) : (
              <CircleDashed size={12} color={theme.colors.warning} />
            )}
            <Text variant="caption" muted style={styles.metaText}>
              {isProcessed ? 'Ready' : 'Processing'}
            </Text>
          </View>
        </View>
      </View>

      <ChevronRight size={18} color={theme.colors.textMuted} opacity={0.5} style={styles.chevron} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 10,
    marginHorizontal: 2,
    opacity: 0.5,
  },
  chevron: {
    marginLeft: 4,
  }
});
