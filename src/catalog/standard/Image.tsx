import { Image as ExpoImage } from 'expo-image';
import { StyleSheet } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { radius } from '../../theme/tokens';

type Variant = 'square' | 'rounded' | 'circle';

export function Image({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const url = resolve(node.url as DynamicString);
  const description = resolve(node.description as DynamicString);
  const fit = (node.fit as 'cover' | 'contain' | 'fill' | undefined) ?? 'cover';
  const variant = (node.variant as Variant | undefined) ?? 'square';

  if (!url) return null;

  return (
    <ExpoImage
      source={{ uri: url }}
      accessibilityLabel={description}
      contentFit={fit}
      style={[styles.base, variant === 'rounded' && styles.rounded, variant === 'circle' && styles.circle]}
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  base: { width: '100%', aspectRatio: 16 / 9 },
  rounded: { borderRadius: radius.lg },
  circle: { borderRadius: 9999, aspectRatio: 1, width: 64, height: 64 },
});
