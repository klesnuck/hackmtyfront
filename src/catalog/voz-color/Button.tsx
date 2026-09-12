import { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useDispatchAction } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import { accessibleMinTouchTarget, colors, radius, spacing } from '../../theme/tokens';
import { AnimatedPressable } from '../shared/AnimatedPressable';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** REQ-ACC-02: taller touch target, higher-contrast border, no ghost/low-contrast look. */
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
      {isPending ? <ActivityIndicator color={variant === 'secondary' ? colors.brand.primary : '#fff'} /> : children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: accessibleMinTouchTarget,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  primary: { backgroundColor: colors.brand.primary },
  danger: { backgroundColor: colors.text.danger },
  secondary: { backgroundColor: colors.surface.card, borderColor: colors.brand.primary },
  ghost: { backgroundColor: colors.surface.card, borderColor: colors.border.strong },
  pending: { opacity: 0.8 },
});
