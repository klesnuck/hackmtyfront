import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../../catalog/shared/AnimatedPressable';
import { colors, radius, spacing, typography } from '../../../theme/tokens';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

/** A selectable destination row — own account or saved third-party recipient. */
export function DestinationRow({ icon, title, subtitle, onPress }: Props) {
  return (
    <AnimatedPressable style={styles.row} onPress={onPress}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={20} color={colors.brand.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.placeholder} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong, color: colors.text.primary },
  subtitle: { ...typography.caption, color: colors.text.secondary },
});
