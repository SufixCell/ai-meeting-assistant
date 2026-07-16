import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../theme';
import { Home, Settings, Clock } from 'lucide-react-native';
import { FloatingNav } from '../../components/ui/floating-nav';

export default function TabsLayout() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme.name === 'arctic' ? 'dark' : 'light'} />
      <Tabs
        tabBar={(props) => <FloatingNav {...props} />}
        screenOptions={{
          headerShown: false,
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
