import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import type { TimeSlot } from '../services/appointments';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

export function TimeSlotGrid({ slots, selectedTime, onSelect }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay horarios disponibles para esta fecha</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const isSelected = slot.time === selectedTime;
        const isDisabled = !slot.available;
        return (
          <TouchableOpacity
            key={slot.time}
            style={[
              styles.slot,
              isSelected && styles.slotSelected,
              isDisabled && styles.slotDisabled,
            ]}
            onPress={() => !isDisabled && onSelect(slot.time)}
            disabled={isDisabled}
            activeOpacity={0.7}
          >
            <Text style={[styles.slotText, isSelected && styles.slotTextSelected, isDisabled && styles.slotTextDisabled]}>
              {slot.time}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  slot: {
    width: '30%',
    minHeight: 44,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  slotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  slotDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.muted,
    opacity: 0.6,
  },
  slotText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
  },
  slotTextSelected: {
    color: colors.white,
  },
  slotTextDisabled: {
    color: colors.mutedForeground,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
