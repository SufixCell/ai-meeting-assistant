import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Lock, Mail, Phone } from 'lucide-react-native';
import { NotiaLogo } from '../../components/NotiaLogo';
import Animated, { FadeIn } from 'react-native-reanimated';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError('Please fill in required fields');
      return;
    }
    
    if (username.includes('@') || username.includes('+')) {
      setError('Username cannot contain @ or + symbols.');
      return;
    }

    setLoading(true);
    setError('');

    const { data: isAvailable, error: checkError } = await supabase.rpc('is_username_available', { p_username: username });
    if (checkError) {
      console.log('Username check failed (might not be deployed):', checkError);
    } else if (isAvailable === false) {
      setError('Username is already taken.');
      setLoading(false);
      return;
    }

    let formattedPhone = phone.trim();
    if (formattedPhone && !formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    const signUpData: any = {
      email,
      password,
      options: {
        data: {
          username,
          ...(formattedPhone ? { phone: formattedPhone } : {})
        }
      }
    };
    if (formattedPhone) {
      signUpData.phone = formattedPhone;
    }

    const { error: signUpError } = await supabase.auth.signUp(signUpData);

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleOAuthLogin = async (provider: 'google') => {
    try {
      setLoading(true);
      setError('');
      
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin + '/login',
          },
        });
        if (error) throw error;
        return;
      }

      const redirectTo = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      const res = await WebBrowser.openAuthSessionAsync(
        data?.url ?? '',
        redirectTo
      );

      if (res.type === 'success') {
        const { url } = res;
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode) throw new Error(errorCode);
        const { access_token, refresh_token } = params;

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
          
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
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
             <NotiaLogo size={42} />
          </View>
          <Text style={[styles.brandText, { color: theme.colors.primary }]}>NOTIA</Text>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Start capturing your meetings with AI</Text>
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
              placeholder="Username"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Mail size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]} 
              placeholder="Email"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Phone size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]} 
              placeholder="Phone (Optional)"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
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

          <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.primaryBtnWrap}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.purple]} style={styles.primaryGradient} start={{x:0, y:0}} end={{x:1,y:1}}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Sign Up</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleOAuthLogin('google')} disabled={loading} style={[styles.ghostButton, { borderColor: theme.colors.border }]}>
            <Text style={[styles.ghostButtonText, { color: theme.colors.text }]}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>Sign In</Text>
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
  input: { flex: 1, fontSize: 16, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  primaryBtnWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  primaryGradient: { height: 54, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  ghostButton: { height: 54, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  ghostButtonText: { fontSize: 15, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { fontSize: 15 },
  linkText: { fontSize: 15, fontWeight: '600' },
});
