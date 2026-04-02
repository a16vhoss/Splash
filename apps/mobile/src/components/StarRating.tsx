import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';

const LABELS: Record<number, string> = {
  1: 'Muy malo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Excelente',
};

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onChange(i)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.star, { color: i <= value ? colors.warning : colors.border }]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      {value > 0 && (
        <Text style={styles.label}>{LABELS[value]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  starButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontSize: 36,
  },
  label: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.foreground,
    marginTop: spacing.sm,
  },
});
