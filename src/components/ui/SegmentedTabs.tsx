import React, { useState } from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { Text } from './Text';

interface Tab {
  key: string;
  label: string;
}

interface SegmentedTabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}

export function SegmentedTabs({ tabs, activeKey, onChange, style }: SegmentedTabsProps) {
  const { theme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useSharedValue(0);

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.key === activeKey));
  const tabWidth = containerWidth / (tabs.length || 1);

  React.useEffect(() => {
    translateX.value = withSpring(activeIndex * tabWidth, {
      mass: 0.5,
      damping: 15,
      stiffness: 150,
    });
  }, [activeIndex, tabWidth]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabWidth - 4, // account for padding
    };
  });

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={[
        {
          height: 40,
          backgroundColor: theme.colors.surfaceHighlight,
          borderRadius: 10,
          padding: 2,
          flexDirection: 'row',
          position: 'relative',
        },
        style,
      ]}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: 2,
              backgroundColor: theme.colors.surface,
              borderRadius: 8,
            },
            animatedStyle,
          ]}
        />
      )}
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => onChange(tab.key)}
          >
            <Text
              style={{
                color: isActive ? theme.colors.text : theme.colors.textMuted,
                fontWeight: isActive ? '600' : '400',
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
