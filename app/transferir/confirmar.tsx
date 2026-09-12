import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { maskAccountNumber } from '../../src/features/transfers/clabe';
import { SummaryRow } from '../../src/features/transfers/components/SummaryRow';
import { TransferHeader } from '../../src/features/transfers/components/TransferHeader';
import { formatCurrency } from '../../src/features/transfers/format';
import { useTransferStore } from '../../src/features/transfers/transfer.store';
import type { TransferDestination } from '../../src/features/transfers/types';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

function destinationLabel(destination: TransferDestination): string {
  return destination.kind === 'own' ? destination.account.label : destination.recipient.nickname;
}

function destinationAccountNumber(destination: TransferDestination): string {
  return destination.kind === 'own'
    ? destination.account.maskedNumber
    : maskAccountNumber(destination.recipient.accountNumber);
}

/**
 * Step 3 of the transfer flow: review/confirm before anything is submitted
 * (spec's "Confirmation step before submission" requirement). Guarded
 * against being opened with no destination/amount chosen yet.
 */
export default function ConfirmarScreen() {
  const sourceAccount = useTransferStore((s) => s.sourceAccount);
  const destination = useTransferStore((s) => s.destination);
  const amount = useTransferStore((s) => s.amount);
  const isSubmitting = useTransferStore((s) => s.isSubmitting);
  const submitTransfer = useTransferStore((s) => s.submitTransfer);

  const [hasNavigatedAway, setHasNavigatedAway] = useState(false);

  useEffect(() => {
    if (!destination || amount === null) router.replace('/transferir');
  }, [destination, amount]);

  if (!destination || amount === null) return null;

  const handleConfirm = async () => {
    await submitTransfer();
    setHasNavigatedAway(true);
    router.replace('/transferir/resultado');
  };

  const busy = isSubmitting || hasNavigatedAway;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <TransferHeader title="Confirmar" />

      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(260)} style={styles.card}>
          <SummaryRow label="Origen" value={sourceAccount.label} />
          <SummaryRow label="Cuenta de origen" value={sourceAccount.maskedNumber} />
          <View style={styles.divider} />
          <SummaryRow label="Destino" value={destinationLabel(destination)} />
          <SummaryRow label="Cuenta destino" value={destinationAccountNumber(destination)} />
          <View style={styles.divider} />
          <SummaryRow label="Monto" value={formatCurrency(amount)} emphasis />
        </Animated.View>

        <AnimatedPressable
          style={[styles.confirmButton, busy && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={busy}
        >
          {busy ? (
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
