import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { theme } from '../theme';
import { Home, Settings, Clock } from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => (
            <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
          ),
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Record',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <Clock size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: 85,
    paddingTop: 15,
  },
});
