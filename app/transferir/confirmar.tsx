import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../../src/api/client';
import { submitTransfer } from '../../src/api/endpoints';
import type { TransferDestination as ApiTransferDestination } from '../../src/api/types';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { maskAccountNumber } from '../../src/features/transfers/clabe';
import { SummaryRow } from '../../src/features/transfers/components/SummaryRow';
import { TransferHeader } from '../../src/features/transfers/components/TransferHeader';
import { formatCurrency } from '../../src/features/transfers/format';
import { useTransferStore } from '../../src/features/transfers/transfer.store';
import type { TransferDestination } from '../../src/features/transfers/types';
import { useSessionStore } from '../../src/state/session.store';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

function destinationLabel(destination: TransferDestination): string {
  return destination.kind === 'own' ? destination.label : destination.alias;
}

function destinationAccountLine(destination: TransferDestination): string {
  return destination.kind === 'own'
    ? destination.accountLine
    : `${destination.bankName} · ${maskAccountNumber(destination.clabe)}`;
}

function toApiDestination(destination: TransferDestination): ApiTransferDestination {
  return destination.kind === 'own'
    ? { kind: 'own', account_id: destination.accountId }
    : {
        kind: 'external',
        clabe: destination.clabe,
        bank_name: destination.bankName,
        alias: destination.alias,
        save_recipient: destination.saveRecipient,
      };
}

function errorMessageFrom(error: unknown): string {
  if (error instanceof ApiError && typeof error.body === 'object' && error.body) {
    const detail = (error.body as { detail?: string }).detail;
    if (detail) return detail;
  }
  return 'No pudimos completar tu transferencia. Intenta de nuevo.';
}

/**
 * Step 3 of the transfer flow: review/confirm before anything is submitted
 * (spec's "Confirmation step before submission" requirement), now hitting the
 * real `POST /api/transfers` endpoint instead of the old client-side
 * simulation. On success, invalidates `['accounts', userId]` (both this
 * screen and Inicio read that key, so both sides refresh immediately) and
 * `['recipients', userId]` when a new recipient was saved — same pattern as
 * `AbonoModal`. Guarded against being opened with no destination/amount/motivo
 * chosen yet.
 */
export default function ConfirmarScreen() {
  const userId = useSessionStore((s) => s.userId);
  const sourceAccountId = useTransferStore((s) => s.sourceAccountId);
  const destination = useTransferStore((s) => s.destination);
  const amount = useTransferStore((s) => s.amount);
  const motivo = useTransferStore((s) => s.motivo);
  const setResult = useTransferStore((s) => s.setResult);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId || !sourceAccountId || !destination || amount === null) {
        throw new Error('missing transfer draft');
      }
      return submitTransfer({
        user_id: userId,
        source_account_id: sourceAccountId,
        amount,
        memo: motivo,
        destination: toApiDestination(destination),
      });
    },
    onSuccess: async () => {
      if (!destination || amount === null) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accounts', userId] }),
        destination.kind === 'external' && destination.saveRecipient
          ? queryClient.invalidateQueries({ queryKey: ['recipients', userId] })
          : Promise.resolve(),
      ]);
      setResult({
        status: 'success',
        amount,
        destinationLabel: destinationLabel(destination),
        completedAt: Date.now(),
      });
      router.replace('/transferir/resultado');
    },
    onError: (error) => {
      setResult({
        status: 'failure',
        reason: errorMessageFrom(error),
        completedAt: Date.now(),
      });
      router.replace('/transferir/resultado');
    },
  });

  useEffect(() => {
    if (!destination || amount === null || !motivo) router.replace('/transferir');
  }, [destination, amount, motivo]);

  if (!destination || amount === null || !sourceAccountId) return null;

  const handleConfirm = () => {
    if (mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <TransferHeader title="Confirmar" />

      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(260)} style={styles.card}>
          <SummaryRow label="Destino" value={destinationLabel(destination)} />
          <SummaryRow label="Cuenta destino" value={destinationAccountLine(destination)} />
          <View style={styles.divider} />
          <SummaryRow label="Motivo" value={motivo} />
          <View style={styles.divider} />
          <SummaryRow label="Monto" value={formatCurrency(amount)} emphasis />
        </Animated.View>

        <AnimatedPressable
          style={[styles.confirmButton, mutation.isPending && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={colors.text.onBrand} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          )}
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },

  content: { flex: 1, padding: spacing.xl, gap: spacing.xxl },

  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    gap: spacing.md,
  },
  divider: { height: 1, backgroundColor: colors.border.subtle },

  confirmButton: {
    marginTop: 'auto',
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { ...typography.button, color: colors.text.onBrand },
});
