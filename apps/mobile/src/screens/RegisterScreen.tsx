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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          nombre,
          email,
          role: 'client',
        });
        if (profileError) throw profileError;
      }
    } catch (err: any) {
      Alert.alert('Error al registrarse', err.message ?? 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para comenzar a reservar</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Juan Pérez"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              autoComplete="name"
            />

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
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoComplete="new-password"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
              <Text style={styles.linkText}>¿Ya tienes cuenta? <Text style={styles.link}>Inicia sesión</Text></Text>
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
  content: { flexGrow: 1, padding: spacing.lg },
  header: { marginBottom: spacing.xl, marginTop: spacing.md },
  backBtn: { marginBottom: spacing.lg },
  backText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.primary },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.fontSize.xxxl, color: colors.foreground },
  subtitle: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.mutedForeground, marginTop: spacing.xs },
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
