import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../services/supabase';
import { colors, spacing, radius, typography } from '../theme';
import type { AuthStackParamList } from '../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Error al iniciar sesión', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.appName}>Splash</Text>
            <Text style={styles.tagline}>Tu lavado, cuando quieras</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoComplete="current-password"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Iniciar sesión'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
              <Text style={styles.linkText}>¿No tienes cuenta? <Text style={styles.link}>Regístrate</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logoSection: { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: {
    width: 72, height: 72, borderRadius: radius.modal,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoText: { fontFamily: typography.fontFamily.extraBold, fontSize: 36, color: colors.white },
  appName: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.fontSize.xxxl, color: colors.foreground },
  tagline: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.mutedForeground, marginTop: spacing.xs },
  form: { gap: spacing.sm },
  label: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.foreground },
  input: {
    height: 48, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.input,
    paddingHorizontal: spacing.md, fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base, color: colors.foreground, backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  button: {
    height: 52, backgroundColor: colors.primary, borderRadius: radius.input,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md, color: colors.white },
  linkRow: { alignItems: 'center', marginTop: spacing.md },
  linkText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.mutedForeground },
  link: { color: colors.primary, fontFamily: typography.fontFamily.semiBold },
});
