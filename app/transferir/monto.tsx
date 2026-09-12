import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { TransferHeader } from '../../src/features/transfers/components/TransferHeader';
import { formatCurrency } from '../../src/features/transfers/format';
import { useTransferStore } from '../../src/features/transfers/transfer.store';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

/**
 * Step 2 of the transfer flow: amount entry, validated against the source
 * account's available balance (spec's "Amount entry validates against
 * available balance" requirement). Guarded against being opened with no
 * destination chosen yet (deep link / stale state).
 */
export default function MontoScreen() {
  const destination = useTransferStore((s) => s.destination);
  const sourceBalance = useTransferStore((s) => s.sourceBalance);
  const setAmount = useTransferStore((s) => s.setAmount);

  const [amountText, setAmountText] = useState('');

  useEffect(() => {
    if (!destination) router.replace('/transferir');
  }, [destination]);

  if (!destination) return null;

  const parsedAmount = Number(amountText.replace(',', '.'));
  const hasAmount = amountText.trim().length > 0 && !Number.isNaN(parsedAmount);

  let errorMessage: string | null = null;
  if (amountText.trim().length === 0) {
    errorMessage = null;
  } else if (!hasAmount || parsedAmount <= 0) {
    errorMessage = 'Ingresa un monto mayor a $0.00.';
  } else if (parsedAmount > sourceBalance) {
    errorMessage = 'El monto excede tu saldo disponible.';
  }

  const canContinue = hasAmount && parsedAmount > 0 && parsedAmount <= sourceBalance;

  const handleContinue = () => {
    if (!canContinue) return;
    setAmount(parsedAmount);
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

  amountBlock: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currencySign: { ...typography.h1, color: colors.text.secondary },
  amountInput: {
    ...typography.h1,
    color: colors.text.primary,
    minWidth: 140,
    textAlign: 'center',
  },
  errorText: { ...typography.caption, color: colors.text.danger, textAlign: 'center' },

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
