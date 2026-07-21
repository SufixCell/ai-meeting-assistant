import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { Check } from 'lucide-react-native';

interface ActionsTabProps {
  actionItems: string[];
  meetingId: string | null;
}

export function ActionsTab({ actionItems, meetingId }: ActionsTabProps) {
  const { theme } = useTheme();
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleCheck = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
    // TODO: Persist checked state to Supabase using meetingId if needed
  };

  if (!actionItems || actionItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          No action items found for this meeting.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.list}>
        {actionItems.map((item, index) => {
          const isChecked = checkedItems.has(index);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => toggleCheck(index)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isChecked ? theme.colors.primary : theme.colors.textMuted,
                    backgroundColor: isChecked ? theme.colors.primary : 'transparent',
                  },
                ]}
              >
                {isChecked && <Check size={12} color="#FFF" />}
              </View>
              <Text
                style={[
                  styles.actionText,
                  {
                    color: isChecked ? theme.colors.textMuted : theme.colors.text,
                    textDecorationLine: isChecked ? 'line-through' : 'none',
                  },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    gap: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
