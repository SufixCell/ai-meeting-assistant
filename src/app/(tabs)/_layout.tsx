import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../theme';
import { Home, Settings, Clock } from 'lucide-react-native';
import { FloatingNav } from '../../components/ui/floating-nav';
import { BotSessionBanner } from '../../components/bot-session-banner';

export default function TabsLayout() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={theme.name === 'arctic' ? 'dark' : 'light'} />
      <Tabs
        tabBar={(props) => <FloatingNav {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
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
        {/* Summary lives inside tabs so it inherits the floating nav bar */}
        <Tabs.Screen
          name="summary"
          options={{
            href: null,
          }}
        />
      </Tabs>
      {/* Bot banner floats over all tabs */}
      <BotSessionBanner />
    </View>
  );
}
