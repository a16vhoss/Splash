import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchCarWashWithServices } from '../services/carWashes';
import { ServiceCard } from '../components/ServiceCard';
import { colors, spacing, radius, typography } from '../theme';
import type { MainStackParamList } from '../navigation/MainTabs';

type Props = NativeStackScreenProps<MainStackParamList, 'WashProfile'>;

export function WashProfileScreen({ route, navigation }: Props) {
  const { carWashId } = route.params;
  const [carWash, setCarWash] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCarWashWithServices(carWashId)
      .then(({ carWash, services }) => {
        setCarWash(carWash);
        setServices(services);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carWashId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!carWash) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudo cargar el lavadero</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stars = Math.round(carWash.rating_promedio ?? 0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerLogo}>
            <Text style={styles.bannerLogoText}>{carWash.nombre.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{carWash.nombre}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Text key={i} style={[styles.star, { color: i <= stars ? colors.warning : colors.border }]}>★</Text>
            ))}
            <Text style={styles.reviewCount}>{carWash.rating_promedio?.toFixed(1)} ({carWash.total_reviews} reseñas)</Text>
          </View>
          <Text style={styles.address}>📍 {carWash.direccion}</Text>
          {carWash.descripcion ? <Text style={styles.description}>{carWash.descripcion}</Text> : null}
        </View>

        {/* Services */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Servicios disponibles</Text>
          {services.length === 0 ? (
            <Text style={styles.emptyText}>No hay servicios disponibles</Text>
          ) : (
            services.map((svc) => (
              <ServiceCard
                key={svc.id}
                nombre={svc.nombre}
                descripcion={svc.descripcion}
                precio={svc.precio}
                duracion_min={svc.duracion_min}
                onPress={() =>
                  navigation.navigate('Schedule', {
                    carWashId,
                    serviceId: svc.id,
                    serviceName: svc.nombre,
                    precio: svc.precio,
                    duracionMin: svc.duracion_min,
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Back button overlay */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.mutedForeground },
  banner: {
    height: 160, backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerLogo: {
    width: 80, height: 80, borderRadius: radius.modal,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8,
    elevation: 4,
  },
  bannerLogoText: { fontFamily: typography.fontFamily.extraBold, fontSize: 40, color: colors.white },
  infoSection: { padding: spacing.lg },
  name: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.fontSize.xxl, color: colors.foreground, marginBottom: spacing.xs },
  starsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  star: { fontSize: 18 },
  reviewCount: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginLeft: spacing.xs },
  address: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.mutedForeground, marginBottom: spacing.sm },
  description: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.foreground, lineHeight: 22 },
  servicesSection: { paddingBottom: spacing.xl },
  sectionTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.foreground, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  emptyText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.mutedForeground, paddingHorizontal: spacing.lg },
  backBtn: {
    position: 'absolute', top: spacing.md, left: spacing.md,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
    elevation: 3,
  },
  backBtnText: { fontFamily: typography.fontFamily.bold, fontSize: 20, color: colors.foreground },
});
