import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import { AlertOctagon } from 'lucide-react-native';
import { ModalWrapper } from './ui/ModalWrapper';

interface ConfirmDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  isDanger?: boolean;
}

export function ConfirmDeleteModal({
  visible,
  onClose,
  onConfirm,
  title = "Move to Trash?",
  description = "This transcript will be moved to your Trash. You can restore it anytime from Settings > Trash.",
  confirmText = "Move to Trash",
  isDanger = false
}: ConfirmDeleteModalProps) {
  const { theme } = useTheme();

  const btnBg = isDanger ? theme.colors.danger : theme.colors.primary;

  return (
    <ModalWrapper visible={visible} onClose={onClose} maxWidth={440}>
      <View style={{ padding: 24, alignItems: 'center' }}>
        <View style={[styles.iconWrapper, { backgroundColor: (isDanger ? theme.colors.danger : theme.colors.primary) + '15' }]}>
          <AlertOctagon size={36} color={isDanger ? theme.colors.danger : theme.colors.primary} />
        </View>
        
        <Text variant="h1" style={{ textAlign: 'center', marginBottom: 12, color: theme.colors.text, fontSize: 22 }}>
          {title}
        </Text>
        
        <Text variant="body" style={{ textAlign: 'center', color: theme.colors.textMuted, marginBottom: 32, lineHeight: 22 }}>
          {description}
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: theme.colors.surfaceHighlight }]}>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              onConfirm();
              onClose();
            }} 
            style={[styles.button, { backgroundColor: btnBg }]}
          >
            <Text style={{ color: '#FFF', fontWeight: '600' }}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
