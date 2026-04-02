import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { submitReview } from '../services/reviews';
import { supabase } from '../services/supabase';
import { StarRating } from '../components/StarRating';
import { colors, spacing, radius, typography } from '../theme';
import type { MainStackParamList } from '../navigation/MainTabs';

type Props = NativeStackScreenProps<MainStackParamList, 'Rating'>;

export function RatingScreen({ route, navigation }: Props) {
  const { appointmentId, carWashName, serviceName, fecha } = route.params;
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Selecciona una calificación', 'Por favor selecciona entre 1 y 5 estrellas');
      return;
    }

    setSubmitting(true);
    try {
      // Fetch car_wash_id from the appointment
      const { data: appt } = await supabase
        .from('appointments')
        .select('car_wash_id')
        .eq('id', appointmentId)
        .single();

      await submitReview({
        appointment_id: appointmentId,
        car_wash_id: appt?.car_wash_id ?? '',
        rating,
        comentario: comentario.trim() || undefined,
      });

      Alert.alert('¡Gracias!', 'Tu reseña ha sido enviada', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Calificar servicio</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.carWashName}>{carWashName}</Text>
            <Text style={styles.serviceDetail}>{serviceName} · {fecha}</Text>
          </View>

          <Text style={styles.sectionLabel}>¿Cómo fue tu experiencia?</Text>
          <StarRating value={rating} onChange={setRating} />

          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Comentario (opcional)</Text>
          <TextInput
            style={styles.textarea}
            value={comentario}
            onChangeText={setComentario}
            placeholder="Cuéntanos cómo fue tu experiencia..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, (submitting || rating === 0) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'Enviando...' : 'Enviar reseña'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.lg },
  backText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.primary },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.fontSize.xxl, color: colors.foreground, marginBottom: spacing.lg },
  summaryCard: {
    backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.md,
    marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  carWashName: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md, color: colors.foreground },
  serviceDetail: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: 2 },
  sectionLabel: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.foreground, marginBottom: spacing.md },
  textarea: {
    minHeight: 120, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.input,
    padding: spacing.md, fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base, color: colors.foreground, backgroundColor: colors.card,
    marginBottom: spacing.xl,
  },
  submitBtn: {
    height: 52, backgroundColor: colors.primary, borderRadius: radius.input,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md, color: colors.white },
});
