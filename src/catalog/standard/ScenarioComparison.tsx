import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type ScenarioRow = {
  label?: string;
  monthlyPayment?: number;
  payoffMonths?: number;
  totalInterest?: number;
  interestSaved?: number;
  monthsSaved?: number;
  note?: string;
};

function money(value: unknown): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `$${number.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
}

function months(value: unknown): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${number} meses`;
}

export function ScenarioComparison({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const title = resolve(node.title as DynamicString);
  const highlightIndex = Number(resolve(node.highlightIndex as DynamicString) ?? -1);
  const raw = resolve(node.scenarios as DynamicString);
  const scenarios = (Array.isArray(raw) ? raw : []) as ScenarioRow[];

  if (scenarios.length === 0) return null;

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {scenarios.map((scenario, index) => {
          const highlighted = index === highlightIndex;
          const label = scenario.label ?? `Escenario ${index + 1}`;
          // Loan-term cards label themselves by term ("12 meses"), so the generic
          // "Plazo" row would just repeat the title.
          const isTermLabel = /^\s*\d+\s*meses?\s*$/i.test(label);
          return (
            <View key={index} style={[styles.card, highlighted && styles.cardHighlighted]}>
              {highlighted && isTermLabel ? (
                <Text style={styles.recommendedTag}>Recomendado</Text>
              ) : null}
              <Text style={[styles.label, highlighted && styles.labelHighlighted]}>{label}</Text>
              <Text style={styles.payment}>{money(scenario.monthlyPayment)}/mes</Text>
              {!isTermLabel ? (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Plazo</Text>
                  <Text style={styles.metricValue}>{months(scenario.payoffMonths)}</Text>
                </View>
              ) : null}
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Interés total</Text>
                <Text style={styles.metricValue}>{money(scenario.totalInterest)}</Text>
              </View>
              {scenario.interestSaved ? (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Ahorro</Text>
                  <Text style={styles.metricSaved}>{money(scenario.interestSaved)}</Text>
                </View>
              ) : null}
              {scenario.monthsSaved ? (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Anticipas</Text>
                  <Text style={styles.metricSaved}>{months(scenario.monthsSaved)}</Text>
                </View>
              ) : null}
              {scenario.note ? <Text style={styles.note}>{scenario.note}</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  title: { ...typography.bodyStrong, color: colors.text.primary },
  row: { gap: spacing.md, paddingVertical: spacing.xs },
  card: {
    width: 172,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHighlighted: { borderColor: colors.brand.primary, borderWidth: 2 },
  recommendedTag: {
    ...typography.caption,
    alignSelf: 'flex-start',
    color: colors.text.onBrand,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    fontWeight: '700',
  },
  label: { ...typography.caption, color: colors.text.secondary, fontWeight: '700' },
  labelHighlighted: { color: colors.brand.primary },
  payment: { ...typography.h3, color: colors.text.primary },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  metricLabel: { ...typography.caption, color: colors.text.secondary },
  metricValue: { ...typography.caption, color: colors.text.primary, fontWeight: '600' },
  metricSaved: { ...typography.caption, color: colors.text.success, fontWeight: '700' },
  note: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
  },
});
