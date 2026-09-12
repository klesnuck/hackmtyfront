import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import type { Loan } from './loans';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

/**
 * Matches Figma node 37:160's loan card: status dot + name, status label,
 * balance/payment row, progress bar, divider, next payment date and
 * "Abonar" — wired to POST /api/liabilities/{id}/payment via the parent
 * screen's AbonoModal (src/features/loans/AbonoModal.tsx).
 */
export function LoanCard({ loan, onAbonar }: { loan: Loan; onAbonar: (loan: Loan) => void }) {
  const isOverdue = loan.status === 'overdue';
  const dotColor = isOverdue ? colors.text.danger : colors.brand.primary;
  const statusLabel = isOverdue ? (loan.overdueLabel ?? 'Atrasado') : 'Al corriente';
  const statusColor = isOverdue ? colors.text.danger : colors.text.secondary;
  const progress = Math.min(100, Math.max(0, loan.progressPercent));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.nameGroup}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text style={styles.name}>{loan.name}</Text>
        </View>
        <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.figureGroup}>
          <Text style={styles.figureLabel}>Saldo Restante</Text>
          <Text style={styles.figureValue}>{currencyFormatter.format(loan.remainingBalance)}</Text>
        </View>
        <View style={[styles.figureGroup, styles.figureGroupEnd]}>
          <Text style={styles.figureLabel}>Pago Mensual</Text>
          <Text style={[styles.figureValue, styles.figureValueAccent]}>
            {currencyFormatter.format(loan.monthlyPayment)}
          </Text>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.row}>
          <Text style={styles.progressLabel}>Progreso de pago</Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.nextPaymentLabel}>Siguiente pago: {loan.nextPaymentDate}</Text>
        <Pressable onPress={() => onAbonar(loan)} hitSlop={8}>
          <Text style={styles.payNowLabel}>Abonar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  nameGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { ...typography.bodyStrong, fontSize: 16, fontWeight: '700', color: colors.text.primary },
  status: { ...typography.caption, fontSize: 13 },

  figureGroup: { gap: spacing.xs, alignItems: 'flex-start' },
  figureGroupEnd: { alignItems: 'flex-end' },
  figureLabel: { ...typography.caption, color: colors.text.secondary },
  figureValue: { ...typography.h3, color: colors.text.primary },
  figureValueAccent: { color: colors.brand.primary },

  progressBlock: { gap: spacing.sm, width: '100%' },
  progressLabel: { ...typography.caption, color: colors.text.secondary },
  progressPercent: { ...typography.caption, fontWeight: '600', color: colors.brand.primary },
  progressTrack: {
    height: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.field,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: { height: '100%', borderRadius: radius.sm, backgroundColor: colors.brand.primary },

  divider: { height: 1, width: '100%', backgroundColor: colors.border.subtle },

  nextPaymentLabel: { ...typography.caption, color: colors.text.secondary },
  payNowLabel: { ...typography.caption, fontWeight: '600', color: colors.brand.primary },
});
