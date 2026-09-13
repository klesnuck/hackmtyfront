import { Text as RNText, StyleSheet } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, typography } from '../../theme/tokens';

export function Heading({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const text = resolve(node.text as DynamicString) ?? '';
  const level = Number(resolve(node.level as DynamicString) ?? 3);

  const styleByLevel = level === 1 ? typography.h1 : level === 2 ? typography.h2 : typography.h3;

  return <RNText style={[styles.base, styleByLevel]}>{text}</RNText>;
}

const styles = StyleSheet.create({
  base: { color: colors.text.primary },
});
