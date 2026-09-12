import { Text as RNText, StyleSheet } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { accessibleTypography, colors } from '../../theme/tokens';

type Variant = keyof typeof accessibleTypography;

/** REQ-ACC-02: larger scale than catalog/standard/Text.tsx — same semantics, different reading. */
export function Text({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const text = resolve(node.text as DynamicString) ?? '';
  const variant = (node.variant as Variant | undefined) ?? 'body';

  return <RNText style={[styles.base, accessibleTypography[variant] ?? accessibleTypography.body]}>{text}</RNText>;
}

const styles = StyleSheet.create({
  base: { color: colors.text.primary },
});
