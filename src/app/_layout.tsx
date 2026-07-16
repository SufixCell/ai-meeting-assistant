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
            <BlurView tint="light" intensity={60} style={StyleSheet.absoluteFill} />
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
    bottom: 24,
    left: 24,
    right: 24,
    elevation: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.50)',
    height: 64,
    paddingBottom: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    overflow: 'hidden',
  },
});
