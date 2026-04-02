import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../services/supabase';
import { colors, spacing, radius, typography } from '../theme';
import type { MainStackParamList } from '../navigation/MainTabs';

type Props = NativeStackScreenProps<MainStackParamList, 'Confirmation'>;

export function ConfirmationScreen({ route, navigation }: Props) {
  const { appointmentId } = route.params;
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('appointments')
      .select(`*, car_washes ( nombre ), services ( nombre, precio, duracion_min )`)
      .eq('id', appointmentId)
      .single()
      .then(({ data }) => {
        setAppointment(data);
        setLoading(false);
      });
  }, [appointmentId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>✓</Text>
        </View>
        <Text style={styles.title}>¡Cita confirmada!</Text>
        <Text style={styles.subtitle}>Tu reserva ha sido registrada exitosamente</Text>

        {appointment && (
          <View style={styles.summaryCard}>
            <Row label="Lavadero" value={appointment.car_washes?.nombre ?? '—'} />
            <Row label="Servicio" value={appointment.services?.nombre ?? '—'} />
            <Row label="Fecha" value={appointment.fecha} />
            <Row label="Hora" value={appointment.hora_inicio?.slice(0, 5)} />
            <Row label="Precio" value={`$${Number(appointment.precio_cobrado ?? appointment.services?.precio ?? 0).toFixed(2)}`} />
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('HomeTabs')}
        >
          <Text style={styles.buttonText}>Ir a mis citas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('HomeTabs')}
        >
          <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  label: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.mutedForeground },
  value: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.foreground },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', padding: spacing.lg, justifyContent: 'center' },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconText: { fontSize: 44, color: colors.white, fontFamily: typography.fontFamily.bold },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.fontSize.xxl, color: colors.foreground, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.mutedForeground, textAlign: 'center', marginBottom: spacing.xl },
  summaryCard: {
    width: '100%', backgroundColor: colors.card, borderRadius: radius.card,
    padding: spacing.lg, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
  },
  button: {
    width: '100%', height: 52, backgroundColor: colors.primary,
    borderRadius: radius.input, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  buttonText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md, color: colors.white },
  secondaryButton: {
    width: '100%', height: 52, backgroundColor: 'transparent',
    borderRadius: radius.input, alignItems: 'center', justifyContent: 'center',
  },
  secondaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.primary },
});
