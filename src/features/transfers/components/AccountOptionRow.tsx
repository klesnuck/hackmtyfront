import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../../catalog/shared/AnimatedPressable';
import { colors, radius, spacing, typography } from '../../../theme/tokens';

type Props = {
  title: string;
  subtitle: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/** A selectable (radio-style) real-account row, used by both account pickers
 * in "Transferir entre mis cuentas" (origin and destination). */
export function AccountOptionRow({ title, subtitle, selected, disabled, onPress }: Props) {
  return (
    <AnimatedPressable
      style={[styles.row, selected && styles.rowSelected, disabled && styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? colors.brand.primary : colors.border.strong}
      />
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
  rowSelected: { borderColor: colors.brand.primary },
  rowDisabled: { opacity: 0.4 },
  text: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong, color: colors.text.primary },
  subtitle: { ...typography.caption, color: colors.text.secondary },
});
