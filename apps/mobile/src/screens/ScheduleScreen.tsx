import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchAvailability, createAppointment } from '../services/appointments';
import { TimeSlotGrid } from '../components/TimeSlotGrid';
import { colors, spacing, radius, typography } from '../theme';
import type { MainStackParamList } from '../navigation/MainTabs';

type Props = NativeStackScreenProps<MainStackParamList, 'Schedule'>;

function getDates(n: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ScheduleScreen({ route, navigation }: Props) {
  const { carWashId, serviceId, serviceName, precio, duracionMin } = route.params;
  const dates = getDates(7);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [closed, setClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const result = await fetchAvailability({ car_wash_id: carWashId, service_id: serviceId, fecha: selectedDate });
      setSlots(result.slots);
      setClosed(result.closed);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [carWashId, serviceId, selectedDate]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const handleConfirm = async () => {
    if (!selectedTime) return;
    setBooking(true);
    try {
      const { appointment } = await createAppointment({
        car_wash_id: carWashId,
        service_id: serviceId,
        fecha: selectedDate,
        hora_inicio: selectedTime,
      });
      navigation.replace('Confirmation', { appointmentId: appointment.id });
    } catch (err: any) {
      Alert.alert('Error al reservar', err.message ?? 'No se pudo crear la cita');
    } finally {
      setBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Elige horario</Text>
          <Text style={styles.subtitle}>{serviceName} · ${precio} · {duracionMin} min</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Date Picker */}
        <Text style={styles.sectionLabel}>Fecha</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePicker}>
          {dates.map((date) => {
            const d = new Date(date + 'T12:00:00');
            const isSelected = date === selectedDate;
            return (
              <TouchableOpacity
                key={date}
                style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDayName, isSelected && styles.dateDayNameSelected]}>
                  {DAY_NAMES[d.getDay()]}
                </Text>
                <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                  {d.getDate()}
                </Text>
                <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
                  {MONTH_NAMES[d.getMonth()]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Slots */}
        <Text style={styles.sectionLabel}>Horarios disponibles</Text>
        {closed ? (
          <View style={styles.closedBox}>
            <Text style={styles.closedText}>Cerrado este día</Text>
          </View>
        ) : loadingSlots ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : (
          <TimeSlotGrid slots={slots} selectedTime={selectedTime} onSelect={setSelectedTime} />
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.cta}>
        <TouchableOpacity
          style={[styles.ctaBtn, (!selectedTime || booking) && styles.ctaBtnDisabled]}
          onPress={handleConfirm}
          disabled={!selectedTime || booking}
        >
          <Text style={styles.ctaBtnText}>
            {booking ? 'Reservando...' : selectedTime ? `Confirmar ${selectedTime}` : 'Selecciona un horario'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: typography.fontFamily.bold, fontSize: 22, color: colors.foreground },
  title: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.foreground },
  subtitle: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: 2 },
  scrollContent: { paddingBottom: spacing.xl },
  sectionLabel: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.mutedForeground, paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  datePicker: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  dateItem: {
    width: 60, paddingVertical: spacing.sm, borderRadius: radius.card,
    backgroundColor: colors.card, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  dateItemSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateDayName: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  dateDayNameSelected: { color: colors.white },
  dateNumber: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.foreground },
  dateNumberSelected: { color: colors.white },
  dateMonth: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  dateMonthSelected: { color: colors.white },
  closedBox: { margin: spacing.lg, padding: spacing.lg, backgroundColor: colors.muted, borderRadius: radius.card, alignItems: 'center' },
  closedText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.mutedForeground },
  cta: { padding: spacing.lg, paddingBottom: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  ctaBtn: { height: 54, backgroundColor: colors.primary, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md, color: colors.white },
});
