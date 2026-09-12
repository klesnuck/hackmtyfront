import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError } from '../../api/client';
import { payLiability } from '../../api/endpoints';
import { AnimatedPressable } from '../../catalog/shared/AnimatedPressable';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import type { Loan } from './loans';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

type AbonoModalProps = {
  loan: Loan | null;
  userId: string | null;
  onClose: () => void;
};

/**
 * Applies a real "abono" (extra/regular payment) against a liability via
 * POST /api/liabilities/{id}/payment — moves money out of the user's account
 * and reduces the liability balance in the actual SQLite database
 * (amitie/backend/mcp_servers/finance/service.py:make_payment), not a
 * client-side simulation.
 */
export function AbonoModal({ loan, userId, onClose }: AbonoModalProps) {
  return (
    <Modal visible={!!loan} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Keyed by loan id so switching loans (or reopening) starts the form fresh
              without syncing props into state via an effect. */}
          {loan ? <AbonoSheet key={loan.id} loan={loan} userId={userId} onClose={onClose} /> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AbonoSheet({ loan, userId, onClose }: { loan: Loan; userId: string | null; onClose: () => void }) {
  const [amount, setAmount] = useState(String(loan.monthlyPayment));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('missing user');
      return payLiability(loan.id, { user_id: userId, amount: Number(amount) });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['loans', userId] }),
        queryClient.invalidateQueries({ queryKey: ['accounts', userId] }),
      ]);
    },
  });

  const numericAmount = Number(amount);
  const isValid = Number.isFinite(numericAmount) && numericAmount > 0;

  const errorMessage = mutation.isError
    ? mutation.error instanceof ApiError && typeof mutation.error.body === 'object'
      ? (mutation.error.body as { detail?: string })?.detail ?? 'No se pudo aplicar el abono.'
      : 'No se pudo aplicar el abono.'
    : null;

  return (
    <>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{mutation.isSuccess ? 'Abono aplicado' : 'Abonar'}</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.text.secondary} />
        </Pressable>
      </View>

      {!mutation.isSuccess && (
        <>
          <Text style={styles.loanName}>{loan.name}</Text>
          <Text style={styles.balanceLine}>Saldo actual: {currencyFormatter.format(loan.remainingBalance)}</Text>

          <Text style={styles.fieldLabel}>Monto a abonar</Text>
          <TextInput
            style={styles.textInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="$0.00"
            placeholderTextColor={colors.text.placeholder}
            keyboardType="numeric"
            editable={!mutation.isPending}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <AnimatedPressable
            style={[styles.submitButton, (!isValid || mutation.isPending) && styles.submitButtonDisabled]}
            onPress={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
          >
            <Text style={styles.submitButtonText}>{mutation.isPending ? 'Aplicando...' : 'Confirmar abono'}</Text>
          </AnimatedPressable>
        </>
      )}

      {mutation.isSuccess && mutation.data && (
        <View style={styles.resultBlock}>
          <Ionicons name="checkmark-circle" size={48} color={colors.text.success} />
          <Text style={styles.resultBody}>
            Abonaste {currencyFormatter.format(mutation.data.applied_amount)}. Nuevo saldo:{' '}
            {currencyFormatter.format(mutation.data.liability?.balance ?? 0)}.
          </Text>
          <AnimatedPressable style={styles.submitButton} onPress={onClose}>
            <Text style={styles.submitButtonText}>Entendido</Text>
          </AnimatedPressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.surface.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: { ...typography.h3, color: colors.text.primary },

  loanName: { ...typography.bodyStrong, color: colors.text.primary },
  balanceLine: { ...typography.body, color: colors.text.secondary },

  fieldLabel: { ...typography.label, color: colors.text.secondary, marginTop: spacing.sm },
  textInput: {
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface.field,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    color: colors.text.primary,
  },

  errorText: { ...typography.caption, color: colors.text.danger },

  submitButton: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { ...typography.button, color: colors.text.onBrand },

  resultBlock: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  resultBody: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
});
