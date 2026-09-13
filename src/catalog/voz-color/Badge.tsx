import { StyleSheet, Text, View } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing } from '../../theme/tokens';

type Tone = 'neutral' | 'positive' | 'warning' | 'danger';

/** REQ-ACC-02: bigger, higher-contrast badge (large text + solid tone fill). */
export function Badge({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const label = resolve(node.label as DynamicString) ?? '';
  const tone = (resolve(node.tone as DynamicString) ?? 'neutral') as Tone;

  const solid =
    tone === 'positive'
      ? colors.text.success
      : tone === 'warning'
        ? '#B45309'
        : tone === 'danger'
          ? colors.text.danger
          : colors.brand.primary;

  return (
    <View style={[styles.badge, { backgroundColor: solid }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
