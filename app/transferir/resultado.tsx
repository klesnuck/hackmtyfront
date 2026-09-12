import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { SummaryRow } from '../../src/features/transfers/components/SummaryRow';
import { formatCurrency } from '../../src/features/transfers/format';
import { useTransferStore } from '../../src/features/transfers/transfer.store';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

/**
 * Step 4 of the transfer flow: the result state (spec's "Result state and
 * balance reflection" requirement). No back-chevron header — a completed or
 * failed transfer shouldn't be trivially backed out of; a plain centered
 * layout instead. Guarded against being opened with no result yet.
 */
export default function ResultadoScreen() {
  const result = useTransferStore((s) => s.result);
  const resetFlow = useTransferStore((s) => s.resetFlow);

  useEffect(() => {
    if (!result) router.replace('/transferir');
  }, [result]);

  if (!result) return null;

  const handleDone = () => {
    resetFlow();
    router.replace('/inicio');
  };

  const handleRetry = () => router.replace('/transferir/confirmar');

  const handleCancel = () => {
    resetFlow();
    router.replace('/inicio');
  };

  const isSuccess = result.status === 'success';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(280)} style={styles.iconWrapper}>
          <Ionicons
            name={isSuccess ? 'checkmark-circle' : 'close-circle'}
            size={72}
            color={isSuccess ? colors.text.success : colors.text.danger}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(280).delay(60)} style={styles.textBlock}>
          <Text style={styles.title}>
            {isSuccess ? 'Transferencia exitosa' : 'No pudimos completar tu transferencia'}
          </Text>
          {!isSuccess && result.reason && <Text style={styles.subtitle}>{result.reason}</Text>}
        </Animated.View>

        {isSuccess && (
          <Animated.View entering={FadeInUp.duration(280).delay(120)} style={styles.card}>
            <SummaryRow label="Destino" value={result.destinationLabel} />
            <SummaryRow label="Monto" value={formatCurrency(result.amount)} emphasis />
          </Animated.View>
        )}

        <View style={styles.actions}>
          {isSuccess ? (
            <AnimatedPressable style={styles.primaryButton} onPress={handleDone}>
              <Text style={styles.primaryButtonText}>Listo</Text>
            </AnimatedPressable>
          ) : (
            <>
              <AnimatedPressable style={styles.primaryButton} onPress={handleRetry}>
                <Text style={styles.primaryButtonText}>Reintentar</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.secondaryButton} onPress={handleCancel}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </AnimatedPressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.xxl,
  },

  iconWrapper: { alignItems: 'center' },

  textBlock: { alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h2, color: colors.text.primary, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },

  card: {
    width: '100%',
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    gap: spacing.md,
  },

  actions: { width: '100%', gap: spacing.md },
  primaryButton: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { ...typography.button, color: colors.text.onBrand },
  secondaryButton: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.field,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { ...typography.button, color: colors.text.primary },
});
