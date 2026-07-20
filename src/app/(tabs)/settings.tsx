import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../../theme';
import { Moon, Sun, Briefcase, LogOut, ChevronRight, User as UserIcon, Phone, Mail } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const { theme, setThemeName } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.surfaceHighlight }]}>
              <UserIcon size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.rowText, { color: theme.colors.text }]}>{profile?.username || 'Username'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.row}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.surfaceHighlight }]}>
              <Mail size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.rowText, { color: theme.colors.text }]}>{profile?.email || user?.email}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.row}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.surfaceHighlight }]}>
              <Phone size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.rowText, { color: theme.colors.text }]}>{profile?.phone || user?.phone || 'No Phone'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.row} onPress={() => setThemeName('midnight')}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.surfaceHighlight }]}>
              <Moon size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.rowText, { color: theme.colors.text }]}>Midnight Theme</Text>
            {theme.name === 'midnight' && <ChevronRight size={20} color={theme.colors.primary} />}
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          
          <TouchableOpacity style={styles.row} onPress={() => setThemeName('arctic')}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.surfaceHighlight }]}>
              <Sun size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.rowText, { color: theme.colors.text }]}>Arctic Theme</Text>
            {theme.name === 'arctic' && <ChevronRight size={20} color={theme.colors.primary} />}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          
          <TouchableOpacity style={styles.row} onPress={() => setThemeName('executive')}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.surfaceHighlight }]}>
              <Briefcase size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.rowText, { color: theme.colors.text }]}>Executive Theme</Text>
            {theme.name === 'executive' && <ChevronRight size={20} color={theme.colors.primary} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: theme.colors.danger + '20', borderColor: theme.colors.danger }]} 
          onPress={handleSignOut}
        >
          <LogOut size={20} color={theme.colors.danger} style={{ marginRight: 8 }} />
          <Text style={[styles.signOutText, { color: theme.colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      {/* Spacer for bottom tabs */}
      <View style={{ height: 130 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
    marginLeft: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
