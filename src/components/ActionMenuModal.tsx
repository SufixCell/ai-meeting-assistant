import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Edit2, Share, Trash2 } from 'lucide-react-native';

interface ActionMenuModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  onRename: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function ActionMenuModal({ visible, onClose, title, onRename, onExport, onDelete }: ActionMenuModalProps) {
  const { theme } = useTheme();

  const handleDelete = () => {
    onClose();
    onDelete();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        
        <Animated.View 
          entering={SlideInDown.duration(300).springify().damping(20)} 
          exiting={SlideOutDown.duration(200)} 
          style={[styles.sheet, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
        >
          <View style={styles.header}>
            <Text variant="label" muted style={{ textAlign: 'center' }}>{title}</Text>
          </View>
          
          <TouchableOpacity style={styles.actionRow} onPress={() => { onClose(); onRename(); }}>
            <Edit2 size={20} color={theme.colors.text} />
            <Text variant="body" style={{ color: theme.colors.text }}>Rename</Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          
          <TouchableOpacity style={styles.actionRow} onPress={() => { onClose(); onExport(); }}>
            <Share size={20} color={theme.colors.text} />
            <Text variant="body" style={{ color: theme.colors.text }}>Export</Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          
          <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
            <Trash2 size={20} color={theme.colors.danger} />
            <Text variant="body" style={{ color: theme.colors.danger, fontWeight: '600' }}>Delete Transcript</Text>
          </TouchableOpacity>
          
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    opacity: 0.5,
  }
});
