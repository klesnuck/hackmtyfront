import { StyleSheet, Text, View } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type Tone = 'neutral' | 'positive' | 'warning' | 'danger';

export function Badge({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const label = resolve(node.label as DynamicString) ?? '';
  const tone = (resolve(node.tone as DynamicString) ?? 'neutral') as Tone;

  const bgStyle =
    tone === 'positive'
      ? styles.bgPositive
      : tone === 'warning'
        ? styles.bgWarning
        : tone === 'danger'
          ? styles.bgDanger
          : styles.bgNeutral;

  const textStyle =
    tone === 'positive'
      ? styles.textPositive
      : tone === 'warning'
        ? styles.textWarning
        : tone === 'danger'
          ? styles.textDanger
          : styles.textNeutral;

  return (
    <View style={[styles.badge, bgStyle]}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  bgNeutral: { backgroundColor: colors.surface.field },
  textNeutral: { color: colors.text.secondary },

  bgPositive: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  textPositive: { color: colors.text.success },

  bgWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  textWarning: { color: '#B45309' },

  bgDanger: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  textDanger: { color: colors.text.danger },
});
