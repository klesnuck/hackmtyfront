import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../theme/tokens';

type Props = {
  label: string;
  value: string;
  emphasis?: boolean;
};

/** A label/value line used on the confirmation and result screens. */
export function SummaryRow({ label, value, emphasis }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, emphasis && styles.valueEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.lg },
  label: { ...typography.body, color: colors.text.secondary },
  value: { ...typography.bodyStrong, color: colors.text.primary },
  valueEmphasis: { ...typography.h3, color: colors.text.primary },
});
