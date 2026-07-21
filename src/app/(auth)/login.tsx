import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { LogIn, User, Lock, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

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

    if (identifier.includes('@')) {
      loginEmail = identifier;
    } else if (identifier.startsWith('+') || /^\d+$/.test(identifier)) {
      loginPhone = identifier.startsWith('+') ? identifier : '+' + identifier;
      loginEmail = '';
    } else {
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
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />
      <Animated.ScrollView contentContainerStyle={styles.scrollContent} entering={FadeIn.duration(600)} showsVerticalScrollIndicator={false}>
        
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <View style={[styles.logoIconWrap, { backgroundColor: theme.colors.surfaceHighlight }]}>
             <Sparkles size={36} color={theme.colors.primary} />
          </View>
          <Text style={[styles.brandText, { color: theme.colors.primary }]}>NOTIA</Text>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Sign in to continue</Text>
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

          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.primaryBtnWrap}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.purple]} style={styles.primaryGradient} start={{x:0, y:0}} end={{x:1,y:1}}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.ghostButton, { borderColor: theme.colors.border }]}>
            <Text style={[styles.ghostButtonText, { color: theme.colors.text }]}>Continue with Google (Coming Soon)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoIconWrap: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  brandText: { fontSize: 32, fontWeight: '800', letterSpacing: 2 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  errorContainer: { padding: 12, borderRadius: 12, marginBottom: 20 },
  errorText: { fontSize: 14, textAlign: 'center' },
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 54 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  forgotPasswordContainer: { alignItems: 'flex-end', marginTop: -8, marginBottom: 8 },
  forgotPasswordText: { fontSize: 14, fontWeight: '500' },
  primaryBtnWrap: { borderRadius: 14, overflow: 'hidden' },
  primaryGradient: { height: 54, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  ghostButton: { height: 54, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  ghostButtonText: { fontSize: 15, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { fontSize: 15 },
  linkText: { fontSize: 15, fontWeight: '600' },
});
