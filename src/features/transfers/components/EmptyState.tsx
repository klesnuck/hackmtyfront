import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../theme/tokens';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
};

/** A plain "nothing here yet, here's why" block — used for the empty saved-
 * recipients list and the "need a second account" own-accounts state. */
export function EmptyState({ icon, title, message }: Props) {
  return (
    <View style={styles.wrapper}>
      <Ionicons name={icon} size={28} color={colors.text.placeholder} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.xxl,
  },
  title: { ...typography.bodyStrong, color: colors.text.primary, textAlign: 'center' },
  message: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
});
