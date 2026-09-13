import { StyleSheet, Text, View } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';

function money(value: unknown): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return '$0';
  return `$${number.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
}

function percent(value: unknown): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  // APR/CAT arrive as fractions (0.24 -> 24%).
  return `${(number * 100).toFixed(1)}%`;
}

/**
 * Read-only summary of an ALREADY-GRANTED loan, for the per-loan detail page.
 * Deliberately has no action: a taken credit is never presented as an offer.
 */
export function LoanSummary({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const amount = resolve(node.amount as DynamicString);
  const monthlyPayment = resolve(node.monthlyPayment as DynamicString);
  const months = resolve(node.months as DynamicString);
  const apr = resolve(node.apr as DynamicString);
  const cat = resolve(node.cat as DynamicString);
  const totalCost = resolve(node.totalCost as DynamicString);
  const progressRaw = Number(resolve(node.progress as DynamicString) ?? 0);
  const progress = Math.min(100, Math.max(0, Number.isFinite(progressRaw) ? progressRaw : 0));
  const tone = String(resolve(node.tone as DynamicString) ?? 'neutral');
  const accent =
    tone === 'positive'
      ? colors.text.success
      : tone === 'warning'
        ? '#B45309'
        : tone === 'danger'
          ? colors.text.danger
          : colors.brand.primary;

  return (
    <View style={[styles.card, { borderColor: accent }]}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: accent }]}>Crédito activo</Text>
        </View>
      </View>
      <Text style={styles.label}>Monto del crédito</Text>
      <Text style={[styles.amount, { color: accent }]}>{money(amount)}</Text>

      <View style={styles.grid}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Pago mensual</Text>
          <Text style={styles.metricValue}>{money(monthlyPayment)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Plazo</Text>
          <Text style={styles.metricValue}>{`${Number(months) || 0} meses`}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Tasa (APR)</Text>
          <Text style={styles.metricValue}>{percent(apr)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>CAT</Text>
          <Text style={styles.metricValue}>{percent(cat)}</Text>
        </View>
      </View>

      {totalCost != null ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Costo total</Text>
          <Text style={styles.summaryValue}>{money(totalCost)}</Text>
        </View>
      ) : null}

      <View style={styles.progressBlock}>
        <View style={styles.row}>
          <Text style={styles.metricLabel}>Pagado</Text>
          <Text style={styles.metricLabel}>{`${Math.round(progress)}%`}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%`, backgroundColor: accent }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 2,
    padding: spacing.xl,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    backgroundColor: colors.surface.field,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { ...typography.caption, fontWeight: '800' },
  label: { ...typography.caption, color: colors.text.secondary, textTransform: 'uppercase' },
  amount: { ...typography.h1, fontSize: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { width: '46%', gap: 2 },
  metricLabel: { ...typography.caption, color: colors.text.secondary },
  metricValue: { ...typography.bodyStrong, color: colors.text.primary },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.md,
  },
  summaryLabel: { ...typography.body, color: colors.text.secondary },
  summaryValue: { ...typography.bodyStrong, color: colors.text.primary },
  progressBlock: { gap: spacing.xs },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.field,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
