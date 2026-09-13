import { Text as RNText, StyleSheet } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { accessibleTypography, colors } from '../../theme/tokens';

type Variant = keyof typeof accessibleTypography;

/** Tone -> color: the accessible interface is color-first, emoji + colored text. */
const TONE_COLOR: Record<string, string> = {
  positive: colors.text.success,
  success: colors.text.success,
  warning: '#B45309',
  danger: colors.text.danger,
  danger_bold: colors.text.danger,
  brand: colors.brand.primary,
};

/** REQ-ACC-02: larger scale than catalog/standard/Text.tsx and tone-aware color. */
export function Text({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const text = resolve(node.text as DynamicString) ?? '';
  const variant = (node.variant as Variant | undefined) ?? 'body';
  const tone = resolve(node.tone as DynamicString);
  const toneColor =
    typeof tone === 'string' && TONE_COLOR[tone.trim().toLowerCase()]
      ? TONE_COLOR[tone.trim().toLowerCase()]
      : undefined;

  return (
    <RNText
      style={[
        styles.base,
        accessibleTypography[variant] ?? accessibleTypography.body,
        toneColor ? { color: toneColor } : null,
      ]}
    >
      {text}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: { color: colors.text.primary },
});
