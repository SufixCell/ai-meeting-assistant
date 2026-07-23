import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Trash2, RotateCcw, X, CheckCircle2, Circle, AlertOctagon } from 'lucide-react-native';
import { useMeetings, MeetingMetadata } from '../contexts/MeetingsContext';
import { AnimatedPressable } from './animated-pressable';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { BlurView } from 'expo-blur';

interface TrashModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TrashModal({ visible, onClose }: TrashModalProps) {
  const { theme } = useTheme();
  const { 
    trashedMeetings, 
    restoreMeeting, 
    restoreMeetings, 
    permanentlyDeleteMeeting, 
    permanentlyDeleteMeetings, 
    emptyTrash 
  } = useMeetings();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{
    visible: boolean;
    title: string;
    description: string;
    confirmText: string;
    action: () => void;
  }>({
    visible: false,
    title: '',
    description: '',
    confirmText: '',
    action: () => {}
  });

  if (!visible) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === trashedMeetings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(trashedMeetings.map(m => m.id));
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedIds.length === 0) return;
    await restoreMeetings(selectedIds);
    setSelectedIds([]);
    setIsSelecting(false);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setConfirmState({
      visible: true,
      title: `Permanently Delete ${selectedIds.length} ${selectedIds.length === 1 ? 'Item' : 'Items'}?`,
      description: 'These items will be permanently erased from your account. This action cannot be undone.',
      confirmText: 'Delete Permanently',
      action: async () => {
        await permanentlyDeleteMeetings(selectedIds);
        setSelectedIds([]);
        setIsSelecting(false);
      }
    });
  };

  const handleSingleDelete = (item: MeetingMetadata) => {
    setConfirmState({
      visible: true,
      title: `Permanently Delete "${item.title}"?`,
      description: 'This transcript will be permanently deleted from your account. This action cannot be undone.',
      confirmText: 'Delete Permanently',
      action: async () => {
        await permanentlyDeleteMeeting(item.id);
      }
    });
  };

  const handleEmptyTrash = () => {
    if (trashedMeetings.length === 0) return;
    setConfirmState({
      visible: true,
      title: 'Empty Trash?',
      description: `Are you sure you want to permanently delete all ${trashedMeetings.length} items from Trash? This action cannot be undone.`,
      confirmText: 'Empty Trash',
      action: async () => {
        await emptyTrash();
        setSelectedIds([]);
        setIsSelecting(false);
      }
    });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, visible: false }));
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </BlurView>

        <View style={styles.centeredWrapper}>
          <Animated.View 
            entering={FadeIn.duration(250)} 
            exiting={FadeOut.duration(200)}
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.headerTitleGroup}>
                <View style={[styles.trashIconBg, { backgroundColor: theme.colors.danger + '15' }]}>
                  <Trash2 size={20} color={theme.colors.danger} />
                </View>
                <View>
                  <Text variant="h2" style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>
                    Trash {trashedMeetings.length > 0 ? `(${trashedMeetings.length})` : ''}
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                    Items can be restored or permanently deleted
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                {trashedMeetings.length > 0 && (
                  <>
                    <TouchableOpacity 
                      onPress={() => {
                        setIsSelecting(prev => !prev);
                        setSelectedIds([]);
                      }}
                      style={[styles.headerBtn, { backgroundColor: isSelecting ? theme.colors.primary : theme.colors.surfaceHighlight }]}
                    >
                      <Text style={{ color: isSelecting ? '#FFF' : theme.colors.text, fontSize: 13, fontWeight: '600' }}>
                        {isSelecting ? 'Done' : 'Select'}
                      </Text>
                    </TouchableOpacity>

                    {!isSelecting && (
                      <TouchableOpacity 
                        onPress={handleEmptyTrash}
                        style={[styles.headerBtn, { backgroundColor: theme.colors.danger + '15' }]}
                      >
                        <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: '600' }}>Empty</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Selection Sub-Header */}
            {isSelecting && trashedMeetings.length > 0 && (
              <View style={[styles.subHeader, { backgroundColor: theme.colors.surfaceHighlight }]}>
                <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllBtn}>
                  <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
                    {selectedIds.length === trashedMeetings.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                  {selectedIds.length} of {trashedMeetings.length} selected
                </Text>
              </View>
            )}

            {/* Trashed List */}
            <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
              {trashedMeetings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={[styles.emptyIconBg, { backgroundColor: theme.colors.surfaceHighlight }]}>
                    <Trash2 size={36} color={theme.colors.textMuted} />
                  </View>
                  <Text variant="h2" style={{ color: theme.colors.text, marginTop: 16, fontSize: 18, fontWeight: '600' }}>
                    Trash is Empty
                  </Text>
                  <Text variant="body" style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 8, maxWidth: 280, fontSize: 13 }}>
                    Deleted transcripts will appear here so you can restore or permanently remove them.
                  </Text>
                </View>
              ) : (
                trashedMeetings.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  const dateStr = new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <AnimatedPressable
                      key={item.id}
                      scaleTo={0.98}
                      onPress={() => isSelecting && toggleSelect(item.id)}
                      style={[
                        styles.itemCard,
                        {
                          backgroundColor: theme.colors.surfaceHighlight,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          borderWidth: isSelected ? 1.5 : 1,
                        }
                      ]}
                    >
                      {isSelecting && (
                        <TouchableOpacity onPress={() => toggleSelect(item.id)} style={{ marginRight: 12 }}>
                          {isSelected ? (
                            <CheckCircle2 size={22} color={theme.colors.primary} />
                          ) : (
                            <Circle size={22} color={theme.colors.textMuted} />
                          )}
                        </TouchableOpacity>
                      )}

                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                          {dateStr} {item.summary ? `• "${item.summary.slice(0, 50)}…"` : ''}
                        </Text>
                      </View>

                      {!isSelecting && (
                        <View style={styles.singleActions}>
                          <TouchableOpacity 
                            onPress={() => restoreMeeting(item.id)} 
                            style={[styles.actionIconBtn, { backgroundColor: theme.colors.primary + '15' }]}
                            title="Restore"
                          >
                            <RotateCcw size={16} color={theme.colors.primary} />
                          </TouchableOpacity>

                          <TouchableOpacity 
                            onPress={() => handleSingleDelete(item)} 
                            style={[styles.actionIconBtn, { backgroundColor: theme.colors.danger + '15' }]}
                            title="Delete Permanently"
                          >
                            <Trash2 size={16} color={theme.colors.danger} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </AnimatedPressable>
                  );
                })
              )}
            </ScrollView>

            {/* Bulk Action Footer */}
            {isSelecting && selectedIds.length > 0 && (
              <View style={[styles.bulkFooter, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity 
                  onPress={handleRestoreSelected}
                  style={[styles.bulkBtn, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}
                >
                  <RotateCcw size={16} color={theme.colors.primary} />
                  <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 14, marginLeft: 8 }}>
                    Restore ({selectedIds.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleDeleteSelected}
                  style={[styles.bulkBtn, { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger }]}
                >
                  <Trash2 size={16} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14, marginLeft: 8 }}>
                    Delete ({selectedIds.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Animated.View>

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        visible={confirmState.visible}
        onClose={closeConfirm}
        onConfirm={confirmState.action}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        isDanger={true}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trashIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    marginLeft: 4,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  selectAllBtn: {
    paddingVertical: 2,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  singleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  bulkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
});
