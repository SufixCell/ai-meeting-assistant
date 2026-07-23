import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import { Edit2, Share, Trash2 } from 'lucide-react-native';
import { ModalWrapper } from './ui/ModalWrapper';

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

  return (
    <ModalWrapper visible={visible} onClose={onClose} maxWidth={360}>
      <View style={{ padding: 16 }}>
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
          <Text variant="body" style={{ color: theme.colors.danger }}>Move to Trash</Text>
        </TouchableOpacity>
      </View>
    </ModalWrapper>
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
