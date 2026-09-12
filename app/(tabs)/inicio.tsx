import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAccounts, getProfile } from '../../src/api/endpoints';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { formatAccountKind, formatBalance } from '../../src/features/dashboard/format';
import { useSessionStore } from '../../src/state/session.store';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

// Figma (node 37:42) uses two accent colors that aren't in theme/tokens.ts
// (a shared file other parallel lanes are also touching this pass, so it's
// left alone here). Kept local until someone promotes them to real tokens.
const accent = {
  savingsTeal: '#00C7BE',
  transferBlue: '#007AFF',
};
const avatarBackground = 'rgba(255,255,255,0.2)';

type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  onPress: () => void;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  const initials = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0];
  return initials.toUpperCase();
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Hola, buen día';
  if (hour < 19) return 'Hola, buenas tardes';
  return 'Hola, buenas noches';
}

export default function InicioScreen() {
  const userId = useSessionStore((s) => s.userId);
  const clearSession = useSessionStore((s) => s.clearSession);
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: profileData } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId as string),
    enabled: !!userId,
  });
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => getAccounts(userId as string),
    enabled: !!userId,
  });

  const displayName = profileData?.profile?.name ?? 'Usuario';
  const accounts = accountsData?.accounts ?? [];

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    };
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar tu sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleCopyAccountId = async (accountId: string) => {
    await Clipboard.setStringAsync(accountId);
    setCopiedAccountId(accountId);
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    copyResetTimer.current = setTimeout(() => setCopiedAccountId(null), 1800);
  };

  const quickActions: QuickAction[] = [
    {
      key: 'ahorros',
      label: 'Apartados',
      icon: 'save-outline',
      tint: accent.savingsTeal,
      onPress: () => router.push('/apartados'),
    },
    {
      key: 'prestamos',
      label: 'Préstamos',
      icon: 'cash-outline',
      tint: colors.brand.primary,
      onPress: () => router.push('/prestamos'),
    },
    {
      key: 'transferir',
      label: 'Transferir',
      icon: 'swap-horizontal-outline',
      tint: accent.transferBlue,
      onPress: () => router.push('/transferir'),
    },
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.greeting}>
            <Text style={styles.greetingEyebrow}>{getTimeOfDayGreeting()}</Text>
            <Text style={styles.greetingName}>{displayName}</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
            <Pressable hitSlop={8}>
              <Ionicons name="notifications-outline" size={22} color={colors.text.onBrand} />
            </Pressable>
            <Pressable hitSlop={8} onPress={handleLogout} accessibilityLabel="Cerrar sesión">
              <Ionicons name="log-out-outline" size={22} color={colors.text.onBrand} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(280)}>
          <AnimatedPressable
            style={styles.banner}
            onPress={() => router.push('/asistente')}
          >
            <View style={styles.bannerGlow} />
            <View style={styles.bannerText}>
              <View style={styles.bannerEyebrowRow}>
                <Ionicons name="sparkles" size={16} color={accent.transferBlue} />
                <Text style={styles.bannerEyebrow}>Asistente Inteligente</Text>
              </View>
              <Text style={styles.bannerTitle}>Asistente de Préstamos IA</Text>
              <Text style={styles.bannerSubtitle}>
                Simula y autoriza tu préstamo ideal con ayuda de nuestra IA.
              </Text>
            </View>
            <View style={styles.bannerCta}>
              <Ionicons name="arrow-forward" size={22} color={colors.text.onBrand} />
            </View>
          </AnimatedPressable>
        </Animated.View>

        {accountsLoading ? (
          <Animated.View entering={FadeInUp.duration(280).delay(80)} style={styles.balanceCard}>
            <View style={styles.balanceLoading}>
              <ActivityIndicator color={colors.brand.primary} />
            </View>
          </Animated.View>
        ) : accounts.length > 0 ? (
          accounts.map((account, index) => (
            <Animated.View
              key={account.id}
              entering={FadeInUp.duration(280).delay(80 + index * 60)}
              style={styles.balanceCard}
            >
              <View style={styles.balanceRow}>
                <Text style={styles.balanceBankName}>{account.institution ?? 'Mi cuenta'}</Text>
                <Text style={styles.balanceAccountNumber}>{formatAccountKind(account.kind)}</Text>
              </View>

              <View style={styles.balanceAmountBlock}>
                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                <Text style={styles.balanceAmount}>
                  {formatBalance(account.balance)}{' '}
                  <Text style={styles.balanceCurrency}>{account.currency}</Text>
                </Text>
              </View>

              <View style={styles.divider} />

              <Pressable style={styles.clabeRow} onPress={() => handleCopyAccountId(account.id)} hitSlop={8}>
                <Text style={styles.clabeText}>Cuenta: {account.id}</Text>
                <Ionicons
                  name={copiedAccountId === account.id ? 'checkmark' : 'copy-outline'}
                  size={16}
                  color={colors.brand.primary}
                />
              </Pressable>
            </Animated.View>
          ))
        ) : (
          <Animated.View entering={FadeInUp.duration(280).delay(80)} style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>No se encontraron cuentas.</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(280).delay(160)} style={styles.shortcutsSection}>
          <Text style={styles.shortcutsTitle}>Operaciones rápidas</Text>
          <View style={styles.shortcutsRow}>
            {quickActions.map((action) => (
              <AnimatedPressable key={action.key} style={styles.shortcutItem} onPress={action.onPress}>
                <View style={[styles.shortcutIcon, { backgroundColor: `${action.tint}1A` }]}>
                  <Ionicons name={action.icon} size={24} color={action.tint} />
                </View>
                <Text style={styles.shortcutLabel}>{action.label}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },
  flex: { flex: 1 },

  header: { backgroundColor: colors.brand.primary },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  greeting: { gap: 2 },
  greetingEyebrow: { ...typography.body, fontSize: 14, color: colors.text.onBrandMuted },
  greetingName: { ...typography.h3, color: colors.text.onBrand },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: avatarBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.bodyStrong, color: colors.text.onBrand },

  body: { padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.text.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bannerText: { flex: 1, gap: 6, paddingRight: spacing.md },
  bannerEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerEyebrow: { ...typography.label, fontSize: 12, color: accent.transferBlue, textTransform: 'uppercase' },
  bannerTitle: { ...typography.h3, color: colors.text.onBrand },
  bannerSubtitle: { ...typography.caption, fontSize: 13, color: colors.text.placeholder },
  bannerCta: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: accent.transferBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  balanceCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  balanceLoading: { paddingVertical: spacing.xl, alignItems: 'center' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceBankName: { ...typography.bodyStrong, color: colors.text.secondary },
  balanceAccountNumber: { ...typography.caption, color: colors.text.placeholder },
  balanceAmountBlock: { gap: 4 },
  balanceLabel: { ...typography.body, fontSize: 13, color: colors.text.secondary },
  balanceAmount: { ...typography.h1, fontWeight: '800', color: colors.text.primary },
  balanceCurrency: { ...typography.bodyStrong, color: colors.text.primary },
  divider: { height: 1, backgroundColor: colors.border.subtle },
  clabeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clabeText: { ...typography.body, fontSize: 13, color: colors.text.secondary },

  shortcutsSection: { gap: spacing.md },
  shortcutsTitle: { ...typography.h3, color: colors.text.primary },
  shortcutsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  shortcutItem: { alignItems: 'center', gap: spacing.sm, width: 100 },
  shortcutIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: { ...typography.bodyStrong, fontSize: 14, color: colors.text.primary },
});
