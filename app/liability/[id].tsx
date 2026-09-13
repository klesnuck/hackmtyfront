import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { A2UISurface, useA2UIStore } from '../../src/a2ui';
import { getLiabilityDetail } from '../../src/api/endpoints';
import { AbonoModal } from '../../src/features/loans/AbonoModal';
import { fetchLoans, type Loan } from '../../src/features/loans/loans';
import { useSessionStore } from '../../src/state/session.store';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

const FALLBACK_LIABILITY = (id: string): Loan => ({
  id,
  source: 'liability',
  name: 'Deuda',
  status: 'on-track',
  remainingBalance: 0,
  monthlyPayment: 0,
  progressPercent: 0,
  nextPaymentDate: 'Sin fecha registrada',
  purpose: null,
});

/**
 * The personalized page for ONE liability. The backend lazily builds the A2UI
 * template (keyed by user+liability, re-hydrated on later visits) and returns
 * the catalog it chose from the deterministic audience. The generated surface
 * carries an `abonar` action, routed here to the same `AbonoModal` used by the
 * Préstamos list (amount + account selection).
 */
export default function LiabilityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useSessionStore((s) => s.userId);
  const applyMessages = useA2UIStore((s) => s.applyMessages);
  const queryClient = useQueryClient();
  const [abonoVisible, setAbonoVisible] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['liability-detail', id, userId],
    queryFn: () => getLiabilityDetail(id as string, userId as string),
    enabled: !!id && !!userId,
  });
  const { data: loans } = useQuery({
    queryKey: ['loans', userId],
    queryFn: () => fetchLoans(userId as string),
    enabled: !!userId,
  });

  useEffect(() => {
    if (data?.a2ui) applyMessages(data.a2ui);
  }, [data, applyMessages]);

  const liability = useMemo(
    () => (loans ?? []).find((item) => item.id === id && item.source === 'liability') ?? null,
    [loans, id],
  );

  const catalogId: 'standard' | 'voz-color' =
    data?.catalog_id === 'amitie.voz-color.v1' ? 'voz-color' : 'standard';

  const closeAbono = () => {
    setAbonoVisible(false);
    // The surface embeds live values; re-hydrate so the new balance shows.
    void queryClient.invalidateQueries({ queryKey: ['liability-detail', id, userId] });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Detalle de la deuda</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
          <Text style={styles.centerText}>Preparando tu página personalizada…</Text>
        </View>
      ) : isError || !data?.surface_id ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.text.placeholder} />
          <Text style={styles.centerText}>No pudimos cargar la página de tu deuda.</Text>
          <Pressable style={styles.retry} onPress={() => refetch()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <A2UISurface
            surfaceId={data.surface_id}
            catalogId={catalogId}
            onAbonar={() => setAbonoVisible(true)}
          />
        </ScrollView>
      )}

      <AbonoModal
        loan={abonoVisible ? liability ?? FALLBACK_LIABILITY(id as string) : null}
        userId={userId}
        onClose={closeAbono}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  topBarTitle: { ...typography.bodyStrong, color: colors.text.primary },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl },
  centerText: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  retry: {
    height: 44,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { ...typography.button, color: colors.text.onBrand },
});
