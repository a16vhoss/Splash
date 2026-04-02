import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface ServiceCardProps {
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_min: number;
  onPress: () => void;
}

export function ServiceCard({ nombre, descripcion, precio, duracion_min, onPress }: ServiceCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name}>{nombre}</Text>
        <Text style={styles.price}>${precio.toFixed(2)}</Text>
      </View>
      {descripcion ? <Text style={styles.description} numberOfLines={2}>{descripcion}</Text> : null}
      <View style={styles.footer}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>⏱ {duracion_min} min</Text>
        </View>
        <View style={styles.ctaBadge}>
          <Text style={styles.ctaText}>Reservar →</Text>
        </View>
      </View>
    </TouchableOpacity>
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
    marginBottom: spacing.xs,
  },
  name: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.sm,
  },
  price: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  durationBadge: {
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  durationText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
  },
  ctaBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  ctaText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
});
