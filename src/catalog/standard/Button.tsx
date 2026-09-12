import { ActivityIndicator, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useDispatchAction } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import { AnimatedPressable } from '../shared/AnimatedPressable';
import { colors, radius, spacing } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({ node, scope, children }: A2UINodeProps) {
  const variant = (node.variant as Variant | undefined) ?? 'primary';
  const dispatch = useDispatchAction(node, scope);
  const [isPending, setIsPending] = useState(false);

  const handlePress = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await dispatch();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={isPending}
      style={[styles.base, styles[variant], isPending && styles.pending]}
    >
      {isPending ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.brand.primary} /> : children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: { backgroundColor: colors.brand.primary },
  danger: { backgroundColor: colors.text.danger },
  secondary: { backgroundColor: colors.surface.field, borderWidth: 1, borderColor: colors.border.subtle },
  ghost: { backgroundColor: 'transparent' },
  pending: { opacity: 0.8 },
});
