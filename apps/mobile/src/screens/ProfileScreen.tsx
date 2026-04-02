import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, radius, typography } from '../theme';

interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

export function ProfileScreen() {
  const { profile, signOut } = useAuth();

  const initial = profile?.nombre?.charAt(0).toUpperCase() ?? '?';

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: '✏️', label: 'Editar perfil', onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto') },
    { icon: '🔔', label: 'Notificaciones', onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto') },
    { icon: '🔒', label: 'Seguridad', onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto') },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{profile?.nombre ?? 'Usuario'}</Text>
          <Text style={styles.email}>{profile?.email ?? ''}</Text>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
              {idx < menuItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Splash v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl, paddingTop: spacing.md },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontFamily: typography.fontFamily.extraBold, fontSize: 36, color: colors.white },
  name: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.foreground },
  email: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs },
  menuCard: {
    backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, minHeight: 52,
  },
  menuIcon: { fontSize: 20, marginRight: spacing.md },
  menuLabel: { flex: 1, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.foreground },
  menuLabelDanger: { color: colors.destructive },
  menuArrow: { fontSize: 20, color: colors.mutedForeground },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  logoutBtn: {
    backgroundColor: colors.destructive + '12', borderRadius: radius.card,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.destructive + '40',
    minHeight: 52, justifyContent: 'center', marginBottom: spacing.lg,
  },
  logoutText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base, color: colors.destructive },
  version: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.mutedForeground, textAlign: 'center' },
});
