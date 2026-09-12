import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../../catalog/shared/AnimatedPressable';
import { colors, radius, spacing, typography } from '../../../theme/tokens';
import { BANK_OPTIONS } from '../banks';

type Props = {
  value: string;
  onChange: (bank: string) => void;
};

/** Fixed chip picker for the "banco" field (design.md non-goal: no CLABE
 * bank-code-prefix lookup). */
export function BankPicker({ value, onChange }: Props) {
  return (
    <View style={styles.chips}>
      {BANK_OPTIONS.map((bank) => {
        const isSelected = value === bank;
        return (
          <AnimatedPressable
            key={bank}
            onPress={() => onChange(bank)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{bank}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
  },
  chipSelected: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  chipLabel: { ...typography.bodyStrong, color: colors.text.primary, fontSize: 13 },
  chipLabelSelected: { color: colors.text.onBrand },
});
