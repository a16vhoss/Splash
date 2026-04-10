import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface AppointmentCardProps {
  appointment: any;
  onRate?: () => void;
  onCancel?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  completed: 'Completada',
  rated: 'Calificada',
  cancelled: 'Cancelada',
  pending: 'Pendiente',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: colors.primary,
  completed: colors.accent,
  rated: colors.accent,
  cancelled: colors.destructive,
  pending: colors.warning,
};

export function AppointmentCard({ appointment, onRate, onCancel }: AppointmentCardProps) {
  const estado = appointment.estado as string;
  const carWash = appointment.car_washes;
  const service = appointment.services;
  const statusLabel = STATUS_LABELS[estado] ?? estado;
  const statusColor = STATUS_COLORS[estado] ?? colors.mutedForeground;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.carWashName}>{carWash?.nombre ?? '—'}</Text>
          <Text style={styles.serviceName}>{service?.nombre ?? '—'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>📅 {appointment.fecha}</Text>
        <Text style={styles.detailText}>🕐 {appointment.hora_inicio?.slice(0, 5)}</Text>
        {service?.precio != null && (
          <Text style={styles.detailText}>💰 ${Number(service.precio).toFixed(2)}</Text>
        )}
      </View>

      {(estado === 'completed' || estado === 'confirmed') && (
        <View style={styles.actions}>
          {estado === 'completed' && onRate && (
            <TouchableOpacity style={styles.rateBtn} onPress={onRate}>
              <Text style={styles.rateBtnText}>⭐ Calificar</Text>
            </TouchableOpacity>
          )}
          {estado === 'confirmed' && onCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  carWashName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.foreground,
  },
  serviceName: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
  },
  details: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  detailText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rateBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.input,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  rateBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.destructive + '15',
    borderRadius: radius.input,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.destructive,
  },
  cancelBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.destructive,
  },
});
