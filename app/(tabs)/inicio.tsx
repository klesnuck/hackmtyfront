import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { formatBalance, MOCK_ACCOUNT } from '../../src/features/dashboard/mockAccount';
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

// Mocked pending a real session display name — SessionResponse (src/api/types.ts)
// only carries session_id + accessibility_profile, no user name.
const MOCK_DISPLAY_NAME: string | undefined = 'Daniela Ramírez';

function getDisplayName(): string {
  return MOCK_DISPLAY_NAME ?? 'Usuario';
}

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
  const displayName = getDisplayName();
  const [clabeCopied, setClabeCopied] = useState(false);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    };
  }, []);

  const handleCopyClabe = async () => {
    await Clipboard.setStringAsync(MOCK_ACCOUNT.clabe);
    setClabeCopied(true);
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    copyResetTimer.current = setTimeout(() => setClabeCopied(false), 1800);
  };

  const quickActions: QuickAction[] = [
    {
      key: 'ahorros',
      label: 'Ahorros',
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

        <Animated.View entering={FadeInUp.duration(280).delay(80)} style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceBankName}>{MOCK_ACCOUNT.bankName}</Text>
            <Text style={styles.balanceAccountNumber}>{MOCK_ACCOUNT.maskedAccountNumber}</Text>
          </View>

          <View style={styles.balanceAmountBlock}>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balanceAmount}>
              {formatBalance(MOCK_ACCOUNT.balance)} <Text style={styles.balanceCurrency}>{MOCK_ACCOUNT.currency}</Text>
            </Text>
          </View>

          <View style={styles.divider} />

          <Pressable style={styles.clabeRow} onPress={handleCopyClabe} hitSlop={8}>
            <Text style={styles.clabeText}>CLABE: {MOCK_ACCOUNT.clabe}</Text>
            <Ionicons
              name={clabeCopied ? 'checkmark' : 'copy-outline'}
              size={16}
              color={colors.brand.primary}
            />
          </Pressable>
        </Animated.View>

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
