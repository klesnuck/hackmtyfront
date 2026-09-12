import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text as RNText, View } from 'react-native';
import { useDispatchAction, useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { AnimatedPressable } from '../shared/AnimatedPressable';

export function DateTimeInput({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const label = resolve(node.label as DynamicString);
  const rawValue = resolve(node.value as DynamicString);
  const enableTime = Boolean(node.enableTime);
  const dispatch = useDispatchAction(node, scope);

  const [date, setDate] = useState(rawValue ? new Date(rawValue) : new Date());
  const [open, setOpen] = useState(false);

  const formatted = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: enableTime ? 'short' : undefined,
  }).format(date);

  return (
    <View style={styles.wrapper}>
      {label && <RNText style={styles.label}>{label}</RNText>}
      <AnimatedPressable style={styles.field} onPress={() => setOpen(true)}>
        <RNText style={styles.value}>{formatted}</RNText>
      </AnimatedPressable>
      {open && (
        <DateTimePicker
          value={date}
          mode={enableTime ? 'datetime' : 'date'}
          onChange={(_event, selected) => {
            setOpen(Platform.OS === 'ios'); // iOS picker is inline; Android is a dialog that self-closes
            if (!selected) return;
            setDate(selected);
            void dispatch({ value: selected.toISOString() });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text.secondary },
  field: {
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
    justifyContent: 'center',
  },
  value: { ...typography.body, color: colors.text.primary },
});
