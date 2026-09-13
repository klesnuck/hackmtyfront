import { StyleSheet, View } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing } from '../../theme/tokens';

/**
 * REQ-ACC-02: color-first card. `tone` paints a strong left accent + tinted
 * background so each idea reads as one colored, emoji-led block.
 */
export function Card({ node, scope, children }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const tone = (resolve(node.tone as DynamicString) ?? 'neutral') as string;
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
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accent: { width: 6, alignSelf: 'stretch' },
  inner: {
    flex: 1,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
});
