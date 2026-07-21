import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder, style, onFocus, onBlur }: SearchBarProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View
      style={[
        {
          height: 48,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: isFocused ? theme.colors.primary : theme.colors.border,
          paddingHorizontal: 12,
        },
        style,
      ]}
    >
      <Search size={20} color={theme.colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          flex: 1,
          marginLeft: 8,
          color: theme.colors.text,
          fontSize: 16,
        }}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={{ padding: 4 }}>
          <X size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}
