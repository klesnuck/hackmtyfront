import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

export function BreakAlert({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const month = Number(resolve(node.month as DynamicString) ?? 0);
  const shortfallRaw = Number(resolve(node.shortfall as DynamicString) ?? 0);
  const reasons = asStrings(resolve(node.reasons as DynamicString));
  const assumptions = asStrings(resolve(node.assumptions as DynamicString));
  const shortfall = Number.isFinite(shortfallRaw)
    ? `$${shortfallRaw.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={22} color={colors.text.danger} />
        <Text style={styles.title}>El plan se quiebra en el mes {month}</Text>
      </View>
      <Text style={styles.shortfall}>
        Faltante estimado: <Text style={styles.shortfallValue}>{shortfall}</Text>
      </Text>
      {reasons.length > 0 ? (
        <View style={styles.section}>
          {reasons.map((reason, index) => (
            <Text key={index} style={styles.bullet}>
              • {reason}
            </Text>
          ))}
        </View>
      ) : null}
      {assumptions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.assumptionTitle}>Supuestos</Text>
          {assumptions.map((assumption, index) => (
            <Text key={index} style={styles.assumption}>
              {assumption}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.text.danger,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.bodyStrong, color: colors.text.danger, flexShrink: 1 },
  shortfall: { ...typography.body, color: colors.text.primary },
  shortfallValue: { fontWeight: '800', color: colors.text.danger },
  section: { gap: spacing.xs },
  bullet: { ...typography.caption, color: colors.text.primary },
  assumptionTitle: { ...typography.caption, color: colors.text.secondary, fontWeight: '700' },
  assumption: { ...typography.caption, color: colors.text.secondary },
});
