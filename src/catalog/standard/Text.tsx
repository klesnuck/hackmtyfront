import { Text as RNText, StyleSheet } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, typography } from '../../theme/tokens';

type Variant = keyof typeof typography;

export function Text({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const text = resolve(node.text as DynamicString) ?? '';
  const variant = (node.variant as Variant | undefined) ?? 'body';

  return <RNText style={[styles.base, typography[variant] ?? typography.body]}>{text}</RNText>;
}

const styles = StyleSheet.create({
  base: { color: colors.text.primary },
});
