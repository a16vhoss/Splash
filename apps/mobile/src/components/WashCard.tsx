import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface WashCardProps {
  id: string;
  nombre: string;
  direccion: string;
  rating_promedio: number;
  total_reviews: number;
  onPress: () => void;
}

export function WashCard({ nombre, direccion, rating_promedio, total_reviews, onPress }: WashCardProps) {
  const initial = nombre.charAt(0).toUpperCase();
  const stars = Math.round(rating_promedio);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>{initial}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{nombre}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Text key={i} style={[styles.star, { color: i <= stars ? colors.warning : colors.border }]}>★</Text>
          ))}
          <Text style={styles.reviewCount}>({total_reviews})</Text>
        </View>
        <Text style={styles.address} numberOfLines={1}>{direccion}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  logoText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.white,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.foreground,
    marginBottom: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  star: {
    fontSize: 14,
  },
  reviewCount: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    marginLeft: spacing.xs,
  },
  address: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
});
