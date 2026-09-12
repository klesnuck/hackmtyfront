import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAccounts } from '../../src/api/endpoints';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { TransferHeader } from '../../src/features/transfers/components/TransferHeader';
import { formatCurrency } from '../../src/features/transfers/format';
import { useTransferStore } from '../../src/features/transfers/transfer.store';
import { useSessionStore } from '../../src/state/session.store';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

/**
 * Step 2 of the transfer flow: amount + motivo entry, validated against the
 * real selected origin account's current available balance (spec's "Amount
 * and motivo entry validates against available balance" requirement) — no
 * more hardcoded `sourceBalance`. Guarded against being opened with no
 * destination chosen yet (deep link / stale state).
 */
export default function MontoScreen() {
  const userId = useSessionStore((s) => s.userId);
  const sourceAccountId = useTransferStore((s) => s.sourceAccountId);
  const destination = useTransferStore((s) => s.destination);
  const setAmount = useTransferStore((s) => s.setAmount);
  const setMotivo = useTransferStore((s) => s.setMotivo);

  const [amountText, setAmountText] = useState('');
  const [motivoText, setMotivoText] = useState('');

  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => getAccounts(userId as string),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!destination || !sourceAccountId) router.replace('/transferir');
  }, [destination, sourceAccountId]);

  if (!destination || !sourceAccountId) return null;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <TransferHeader title="Monto" />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const sourceAccount = accountsData?.accounts.find((a) => a.id === sourceAccountId);
  const sourceBalance = sourceAccount?.balance ?? 0;

  const parsedAmount = Number(amountText.replace(',', '.'));
  const hasAmount = amountText.trim().length > 0 && !Number.isNaN(parsedAmount);
  const hasMotivo = motivoText.trim().length > 0;

  let errorMessage: string | null = null;
  if (amountText.trim().length === 0) {
    errorMessage = null;
  } else if (!hasAmount || parsedAmount <= 0) {
    errorMessage = 'Ingresa un monto mayor a $0.00.';
  } else if (parsedAmount > sourceBalance) {
    errorMessage = 'El monto excede tu saldo disponible.';
  }

  const canContinue = hasAmount && parsedAmount > 0 && parsedAmount <= sourceBalance && hasMotivo;

  const handleContinue = () => {
    if (!canContinue) return;
    setAmount(parsedAmount);
    setMotivo(motivoText.trim());
    router.push('/transferir/confirmar');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <TransferHeader title="Monto" />

      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(260)} style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balanceValue}>{formatCurrency(sourceBalance)}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(260).delay(60)} style={styles.amountBlock}>
          <View style={styles.amountRow}>
            <Text style={styles.currencySign}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0.00"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(260).delay(100)} style={styles.field}>
          <Text style={styles.fieldLabel}>Motivo</Text>
          <TextInput
            style={styles.input}
            value={motivoText}
            onChangeText={setMotivoText}
            placeholder="Ej. Renta de septiembre"
            placeholderTextColor={colors.text.placeholder}
          />
        </Animated.View>

        <AnimatedPressable
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueButtonText}>Continuar</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1, padding: spacing.xl, gap: spacing.xxl },

  balanceBlock: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  balanceLabel: { ...typography.label, color: colors.text.secondary },
  balanceValue: { ...typography.h3, color: colors.text.primary },

  amountBlock: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currencySign: { ...typography.h1, color: colors.text.secondary },
  amountInput: {
    ...typography.h1,
    color: colors.text.primary,
    minWidth: 140,
    textAlign: 'center',
  },
  errorText: { ...typography.caption, color: colors.text.danger, textAlign: 'center' },

  field: { gap: spacing.sm },
  fieldLabel: { ...typography.label, color: colors.text.secondary },
  input: {
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
  },

  continueButton: {
    marginTop: 'auto',
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: { opacity: 0.4 },
  continueButtonText: { ...typography.button, color: colors.text.onBrand },
});
