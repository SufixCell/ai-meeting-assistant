import { Tabs, usePathname, useRouter } from 'expo-router';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../theme';
import { Home, Settings, BookOpen, Menu } from 'lucide-react-native';
import { FloatingNav } from '../../components/ui/floating-nav';
import { useSidebar } from '../../contexts/SidebarContext';
import { BotSessionBanner } from '../../components/bot-session-banner';
import { AnimatedPressable } from '../../components/animated-pressable';
import React from 'react';

import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeIn, FadeOut } from 'react-native-reanimated';

function DesktopSidebar() {
  const { theme } = useTheme();
  const { openSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);

  const widthAnim = useSharedValue(260);

  React.useEffect(() => {
    widthAnim.value = withSpring(collapsed ? 52 : 260, { damping: 24, stiffness: 240, mass: 0.8 });
  }, [collapsed]);

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    width: widthAnim.value,
  }));

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Notebook', path: '/history', icon: BookOpen },
  ];

  return (
    <Animated.View 
      style={[
        styles.sidebar, 
        animatedSidebarStyle,
        { 
          backgroundColor: theme.colors.background, 
          borderRightColor: collapsed ? 'transparent' : theme.colors.border,
          borderRightWidth: collapsed ? 0 : 1,
          paddingHorizontal: collapsed ? 6 : 16,
          overflow: 'hidden'
        }
      ]}
    >
      <View style={[styles.sidebarHeader, collapsed && { justifyContent: 'center', paddingHorizontal: 0, marginBottom: 16 }]}>
        <AnimatedPressable onPress={() => setCollapsed(prev => !prev)} style={styles.menuIconBtn} scaleTo={0.92}>
          <Menu size={22} color={theme.colors.text} />
        </AnimatedPressable>
        {!collapsed && (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(100)}>
            <Text style={[styles.brandName, { color: theme.colors.text }]}>Intelligence</Text>
          </Animated.View>
        )}
      </View>
      
      {!collapsed && (
        <Animated.View entering={FadeIn.duration(250).delay(80)} exiting={FadeOut.duration(100)} style={styles.navContainer}>
          {navItems.map(item => {
            const isActive = pathname === item.path || (item.path === '/' && pathname === '/index');
            const Icon = item.icon;
            
            return (
              <AnimatedPressable 
                key={item.path}
                onPress={() => router.push(item.path as any)}
                scaleTo={0.96}
                style={[
                  styles.sidebarItem, 
                  isActive && { backgroundColor: theme.colors.surfaceHighlight }
                ]}
              >
                <Icon size={20} color={isActive ? theme.colors.primary : theme.colors.textMuted} />
                <Text style={[
                  styles.sidebarLabel, 
                  { color: isActive ? theme.colors.text : theme.colors.textMuted, fontWeight: isActive ? '600' : '500' }
                ]}>
                  {item.name}
                </Text>
              </AnimatedPressable>
            );
          })}
          
          {/* Settings triggers Premium Sidebar Drawer */}
          <AnimatedPressable 
            onPress={openSidebar}
            scaleTo={0.96}
            style={styles.sidebarItem}
          >
            <Settings size={20} color={theme.colors.textMuted} />
            <Text style={[styles.sidebarLabel, { color: theme.colors.textMuted, fontWeight: '500' }]}>
              Settings
            </Text>
          </AnimatedPressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column', backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.name === 'arctic' ? 'dark' : 'light'} />
      
      {isDesktop && <DesktopSidebar />}

      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={(props) => isDesktop ? null : <FloatingNav {...props} />}
          screenOptions={{ 
            headerShown: false,
            sceneStyle: { backgroundColor: 'transparent' }
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
          <Tabs.Screen name="history" options={{ title: 'Notebook', tabBarIcon: ({ color }) => <BookOpen size={22} color={color} /> }} />
          <Tabs.Screen name="summary" options={{ href: null }} />
        </Tabs>
        <BotSessionBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    borderRightWidth: 1,
    paddingTop: 32,
    paddingHorizontal: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 12,
    gap: 12,
  },
  menuIconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  navContainer: {
    gap: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  sidebarLabel: {
    fontSize: 15,
  },
});
