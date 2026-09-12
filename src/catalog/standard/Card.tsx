import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { A2UINodeProps } from '../../a2ui/registry';
import { colors, radius, spacing } from '../../theme/tokens';

export function Card({ children }: A2UINodeProps) {
  return (
    <Animated.View entering={FadeInUp.duration(220)} style={styles.card}>
      <View style={styles.inner}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  inner: {
    padding: spacing.xl,
    gap: spacing.md,
  },
});
