import { StyleSheet, Text, View } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function ProgressBar({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const rawValue = resolve(node.value as DynamicString) ?? 0;
  const rawMax = resolve(node.max as DynamicString) ?? 100;
  const label = resolve(node.label as DynamicString);

  const value = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue)) || 0;
  const max = typeof rawMax === 'number' ? rawMax : parseFloat(String(rawMax)) || 100;
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.valueText}>{`${Math.round(percentage)}%`}</Text>
        </View>
      ) : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  valueText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  track: {
    height: 8,
    backgroundColor: colors.surface.field,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
  },
});
