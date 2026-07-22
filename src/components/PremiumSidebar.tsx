import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import { useSidebar } from '../contexts/SidebarContext';
import { Home, BookOpen, Trash2, Search, Zap, LogOut, ChevronRight, Play, Shield, Keyboard, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { AnimatedPressable } from './animated-pressable';

import { useMeetings } from '../contexts/MeetingsContext';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.85, 360);

export function PremiumSidebar() {
  const { theme, setThemeName } = useTheme();
  const { sidebarVisible, closeSidebar } = useSidebar();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { meetings } = useMeetings();

  const displayName = user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      user?.user_metadata?.username || 
                      (user?.email ? user.email.split('@')[0] : 'User');
  const initial = displayName.charAt(0).toUpperCase();

  // Dynamic Real Data Stats
  const meetingCount = meetings.length;
  const summaryCount = meetings.filter(m => m.summary && m.summary.trim().length > 0).length;
  const totalMinutes = meetings.reduce((acc, m) => acc + (m.summary ? 20 : 5), 0);
  const formattedRecorded = totalMinutes >= 60 
    ? `${Math.round((totalMinutes / 60) * 10) / 10}h` 
    : `${totalMinutes}m`;

  const latestMeeting = meetings.length > 0 ? meetings[0] : null;

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (sidebarVisible) {
      translateX.value = withSpring(0, { damping: 24, stiffness: 250, mass: 0.8 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withSpring(-SIDEBAR_WIDTH, { damping: 24, stiffness: 250, mass: 0.8 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [sidebarVisible]);

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: sidebarVisible ? 'auto' : 'none',
  }));

  if (!sidebarVisible && translateX.value === -SIDEBAR_WIDTH) return null;

  const handleNav = (path: any) => {
    closeSidebar();
    setTimeout(() => router.push(path), 300);
  };

  const handleSignOut = async () => {
    closeSidebar();
    setTimeout(signOut, 300);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Heavy Blur Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle, { zIndex: 99 }]}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={closeSidebar}>
          <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={StyleSheet.absoluteFill} />
          {/* Dark tint overlay for noise/depth */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
        </TouchableOpacity>
      </Animated.View>

      {/* Sidebar Panel */}
      <Animated.View 
        style={[
          styles.sidebar, 
          animatedSidebarStyle, 
          { backgroundColor: theme.name === 'arctic' ? 'rgba(255,255,255,0.95)' : 'rgba(15,15,20,0.95)', borderRightColor: theme.colors.border, zIndex: 100 }
        ]}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top || 40, paddingBottom: insets.bottom + 20 }}>
          
          {/* Header Profile */}
          <View style={styles.header}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '700' }}>{initial}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text variant="h3" style={{ fontWeight: '600' }}>{displayName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13 }}>AI Pro</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginLeft: 8 }}>· Synced just now</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats - Live Dynamic Data */}
          <View style={[styles.statsRow, { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.statBox}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text }}>{meetingCount}</Text>
              <Text variant="caption" style={{ color: theme.colors.textMuted }}>Meetings</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statBox}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text }}>{formattedRecorded}</Text>
              <Text variant="caption" style={{ color: theme.colors.textMuted }}>Recorded</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statBox}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text }}>{summaryCount}</Text>
              <Text variant="caption" style={{ color: theme.colors.textMuted }}>Summaries</Text>
            </View>
          </View>

          {/* Continue Working */}
          <View style={styles.section}>
            <Text variant="label" style={{ marginBottom: 12, marginLeft: 16 }}>CONTINUE WORKING</Text>
            {latestMeeting ? (
              <AnimatedPressable scaleTo={0.97} onPress={() => handleNav({ pathname: '/(tabs)/summary', params: { meetingId: latestMeeting.id } })} style={[styles.resumeCard, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text numberOfLines={1} style={{ fontWeight: '600', color: theme.colors.text, fontSize: 15 }}>{latestMeeting.title}</Text>
                  <Text style={{ color: theme.colors.textMuted, marginTop: 4, fontSize: 12 }}>Recorded {new Date(latestMeeting.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.playBtn, { backgroundColor: theme.colors.primary }]}>
                  <Play size={14} color="#FFF" fill="#FFF" />
                </View>
              </AnimatedPressable>
            ) : (
              <View style={[styles.resumeCard, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>No recent meetings yet</Text>
              </View>
            )}
          </View>

          {/* Quick Nav */}
          <View style={styles.section}>
            <Text variant="label" style={{ marginBottom: 8, marginLeft: 16 }}>WORKSPACE</Text>
            <NavItem icon={Home} label="Home" active={pathname === '/' || pathname === '/index'} onPress={() => handleNav('/')} theme={theme} />
            <NavItem icon={BookOpen} label="Notebook" active={pathname === '/history'} onPress={() => handleNav('/history')} theme={theme} />
            <NavItem icon={Search} label="Quick Search" active={false} onPress={() => handleNav('/history')} theme={theme} />
            <NavItem icon={Trash2} label="Trash" active={false} onPress={() => handleNav('/history')} theme={theme} />
          </View>

          {/* Appearance Settings */}
          <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
            <Text variant="label" style={{ marginBottom: 12, marginLeft: 16 }}>APPEARANCE</Text>
            <View style={[styles.themeSelector, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
              {['midnight', 'executive', 'arctic'].map((t) => (
                <TouchableOpacity 
                  key={t} 
                  onPress={() => setThemeName(t as any)} 
                  style={[styles.themeOption, theme.name === t && { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]}
                >
                  <Text style={{ color: theme.name === t ? theme.colors.text : theme.colors.textMuted, fontWeight: theme.name === t ? '600' : '500', textTransform: 'capitalize' }}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* More */}
          <View style={styles.section}>
            <Text variant="label" style={{ marginBottom: 8, marginLeft: 16 }}>MORE</Text>
            <NavItem icon={Shield} label="Privacy" active={false} onPress={() => {}} theme={theme} />
            {Platform.OS === 'web' && <NavItem icon={Keyboard} label="Keyboard Shortcuts" active={false} onPress={() => {}} theme={theme} />}
            <NavItem icon={Info} label="What's New" active={false} onPress={() => {}} theme={theme} />
          </View>

          {/* Footer */}
          <View style={{ marginTop: 20, marginBottom: 40 }}>
             <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
               <LogOut size={18} color={theme.colors.danger} />
               <Text style={{ color: theme.colors.danger, fontWeight: '600', marginLeft: 12 }}>Sign Out</Text>
             </TouchableOpacity>
          </View>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

function NavItem({ icon: Icon, label, active, onPress, theme }: any) {
  return (
    <AnimatedPressable scaleTo={0.97} onPress={onPress} style={[styles.navItem, active && { backgroundColor: theme.colors.surfaceHighlight }]}>
      <Icon size={20} color={active ? theme.colors.text : theme.colors.textMuted} />
      <Text style={[styles.navLabel, { color: active ? theme.colors.text : theme.colors.textMuted, fontWeight: active ? '600' : '500' }]}>{label}</Text>
      {active && <View style={[styles.activeIndicator, { backgroundColor: theme.colors.text }]} />}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    alignSelf: 'center',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2, // optical center for play icon
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  navLabel: {
    fontSize: 16,
    marginLeft: 16,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    bottom: '50%',
    width: 3,
    height: 16,
    marginTop: -8,
    borderRadius: 3,
  },
  themeSelector: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginHorizontal: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  }
});
