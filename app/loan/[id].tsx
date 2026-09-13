import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { A2UISurface, useA2UIStore } from '../../src/a2ui';
import { getApiBaseUrl, getLoanDetail } from '../../src/api/endpoints';
import { playAudioAsset } from '../../src/features/voice/audioCache';
import { useSessionStore } from '../../src/state/session.store';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

/**
 * The personalized page for ONE loan. The backend lazily builds the A2UI
 * template (keyed by user+loan, re-hydrated on later visits) and returns the
 * catalog it chose from the deterministic audience — this screen renders
 * whatever it sent, in that catalog.
 */
export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useSessionStore((s) => s.userId);
  const applyMessages = useA2UIStore((s) => s.applyMessages);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['loan-detail', id, userId],
    queryFn: () => getLoanDetail(id as string, userId as string),
    enabled: !!id && !!userId,
  });

  useEffect(() => {
    if (data?.a2ui) applyMessages(data.a2ui);
  }, [data, applyMessages]);

  useEffect(() => {
    if (data?.audio_ref) void playAudioAsset(data.audio_ref, getApiBaseUrl());
  }, [data?.audio_ref]);

  const catalogId: 'standard' | 'voz-color' =
    data?.catalog_id === 'amitie.voz-color.v1' ? 'voz-color' : 'standard';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Detalle del crédito</Text>
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
          <Text style={styles.centerText}>No pudimos cargar la página de tu crédito.</Text>
          <Pressable style={styles.retry} onPress={() => refetch()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <A2UISurface surfaceId={data.surface_id} catalogId={catalogId} />
        </ScrollView>
      )}
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
