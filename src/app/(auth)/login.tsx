import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { LogIn, User, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const router = useRouter();

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');

    let loginEmail = identifier.trim();
    let loginPhone = undefined;

    // Determine if identifier is an email, phone, or username
    if (identifier.includes('@')) {
      // It's an email
      loginEmail = identifier;
    } else if (identifier.startsWith('+') || /^\d+$/.test(identifier)) {
      // It's a phone number
      loginPhone = identifier.startsWith('+') ? identifier : '+' + identifier;
      loginEmail = '';
    } else {
      // It's a username. We need to look up the email.
      const { data: emailData, error: lookupError } = await supabase.rpc('get_email_by_username', { p_username: identifier });
      if (lookupError || !emailData) {
        setLoading(false);
        setError('User not found.');
        return;
      }
      loginEmail = emailData;
    }

    let authError;
    if (loginPhone) {
      const { error } = await supabase.auth.signInWithPassword({ phone: loginPhone, password });
      authError = error;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      authError = error;
    }

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primaryGlow, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.colors.surfaceHighlight }]} >
             <LogIn size={32} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Sign in to your AI Meeting Assistant</Text>
        </View>

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.danger + '20' }]}>
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <User size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]} 
              placeholder="Email, Username, or Phone"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Lock size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]} 
              placeholder="Password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
          </TouchableOpacity>
          
          {/* Google Placeholder */}
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.border }]}>
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Continue with Google (Coming Soon)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 15,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
