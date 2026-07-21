import './global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider } from '../theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { BotSessionProvider } from '../contexts/BotSessionContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { MeetingsProvider } from '../contexts/MeetingsContext';
import { PremiumSidebar } from '../components/PremiumSidebar';
import { useEffect } from 'react';
import { View } from 'react-native';

function RootLayoutNav() {
  const { session, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  if (!initialized) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MeetingsProvider>
          <SidebarProvider>
            <BotSessionProvider>
              <View style={{ flex: 1 }}>
                <RootLayoutNav />
                <PremiumSidebar />
              </View>
            </BotSessionProvider>
          </SidebarProvider>
        </MeetingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
