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
  return `${(number * 100).toFixed(1)}%`;
}

/**
 * Read-only summary of an ACTIVE liability (card / debt), for the per-liability
 * detail page. Has no action; the paying action lives in an explicit `abonar`
 * Button the page renders separately.
 */
export function LiabilitySummary({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const creditor = resolve(node.creditor as DynamicString) ?? '';
  const kind = resolve(node.kind as DynamicString);
  const balance = resolve(node.balance as DynamicString);
  const principal = resolve(node.principal as DynamicString);
  const apr = resolve(node.apr as DynamicString);
  const minPayment = resolve(node.minPayment as DynamicString);
  const dueDay = resolve(node.dueDay as DynamicString);
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
        <Text style={styles.creditor}>{creditor}</Text>
        {kind ? <Text style={styles.kind}>{kind}</Text> : null}
      </View>
      <Text style={styles.label}>Saldo actual</Text>
      <Text style={[styles.balance, { color: accent }]}>{money(balance)}</Text>

      <View style={styles.grid}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Pago mínimo</Text>
          <Text style={styles.metricValue}>{money(minPayment)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Tasa (APR)</Text>
          <Text style={styles.metricValue}>{percent(apr)}</Text>
        </View>
        {principal != null ? (
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Deuda original</Text>
            <Text style={styles.metricValue}>{money(principal)}</Text>
          </View>
        ) : null}
        {dueDay != null ? (
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Día de pago</Text>
            <Text style={styles.metricValue}>{`Día ${Number(dueDay)}`}</Text>
          </View>
        ) : null}
      </View>

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
  creditor: { ...typography.bodyStrong, fontSize: 18, color: colors.text.primary },
  kind: { ...typography.caption, color: colors.text.secondary, textTransform: 'capitalize' },
  label: { ...typography.caption, color: colors.text.secondary, textTransform: 'uppercase' },
  balance: { ...typography.h1, fontSize: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { width: '46%', gap: 2 },
  metricLabel: { ...typography.caption, color: colors.text.secondary },
  metricValue: { ...typography.bodyStrong, color: colors.text.primary },
  progressBlock: { gap: spacing.xs },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.field,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
