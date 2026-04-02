import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchNearbyCarWashes } from '../services/carWashes';
import { WashCard } from '../components/WashCard';
import { colors, spacing, typography } from '../theme';
import type { MainStackParamList } from '../navigation/MainTabs';
import type { CarWash } from '@splash/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'HomeTabs'>;

export function HomeScreen({ navigation }: Props) {
  const [carWashes, setCarWashes] = useState<CarWash[]>([]);
  const [filtered, setFiltered] = useState<CarWash[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchNearbyCarWashes();
      setCarWashes(data);
      setFiltered(data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(carWashes.filter((c) => c.nombre.toLowerCase().includes(q)));
  }, [search, carWashes]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
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
      <View style={styles.headerSection}>
        <Text style={styles.greeting}>Hola 👋</Text>
        <Text style={styles.title}>¿Dónde lavamos hoy?</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar lavadero..."
          placeholderTextColor={colors.mutedForeground}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WashCard
            id={item.id}
            nombre={item.nombre}
            direccion={item.direccion}
            rating_promedio={item.rating_promedio}
            total_reviews={item.total_reviews}
            onPress={() => navigation.navigate('WashProfile', { carWashId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No se encontraron lavaderos</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerSection: { padding: spacing.lg, paddingBottom: spacing.md },
  greeting: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.mutedForeground },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.fontSize.xxl, color: colors.foreground, marginBottom: spacing.md },
  searchInput: {
    height: 48, backgroundColor: colors.card, borderRadius: 999,
    paddingHorizontal: spacing.md, fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base, color: colors.foreground,
    borderWidth: 1, borderColor: colors.border,
  },
  list: { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.mutedForeground },
});
