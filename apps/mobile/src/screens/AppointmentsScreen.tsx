import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchMyAppointments, cancelAppointment } from '../services/appointments';
import { AppointmentCard } from '../components/AppointmentCard';
import { colors, spacing, typography } from '../theme';
import type { MainStackParamList } from '../navigation/MainTabs';

type Props = NativeStackScreenProps<MainStackParamList, 'HomeTabs'>;

export function AppointmentsScreen({ navigation }: Props) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchMyAppointments();
      setAppointments(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRefresh = () => { setRefreshing(true); load(); };

  const handleCancel = (id: string) => {
    Alert.alert(
      'Cancelar cita',
      '¿Estás seguro de que deseas cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment(id, 'Cancelado por el cliente');
              load();
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'No se pudo cancelar');
            }
          },
        },
      ],
    );
  };

  const handleRate = (appointment: any) => {
    navigation.navigate('Rating', {
      appointmentId: appointment.id,
      carWashName: appointment.car_washes?.nombre ?? '',
      serviceName: appointment.services?.nombre ?? '',
      fecha: appointment.fecha,
    });
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>Mis citas</Text>
      </View>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onRate={item.estado === 'completed' ? () => handleRate(item) : undefined}
            onCancel={item.estado === 'confirmed' ? () => handleCancel(item.id) : undefined}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Sin citas aún</Text>
            <Text style={styles.emptyText}>Reserva tu primera cita en la pantalla de inicio</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.fontSize.xxl, color: colors.foreground },
  list: { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
  empty: { flex: 1, alignItems: 'center', padding: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.foreground, marginBottom: spacing.xs },
  emptyText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.mutedForeground, textAlign: 'center' },
});
