import { useState } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { useDispatchAction, useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { AnimatedPressable } from '../shared/AnimatedPressable';

type Option = { label: string; value: string };

/**
 * Implements `displayStyle: "chips"` (the common case for short option lists —
 * strategy choices, tradeoffs). "list" and "dropdown" styles are TODO: swap
 * the option row's layout, the interaction/data model stays the same.
 */
export function ChoicePicker({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const label = resolve(node.label as DynamicString);
  const options = (Array.isArray(node.options) ? node.options : []) as Option[];
  const isMultiple = node.variant === 'multiple';
  const initialValue = resolve(node.value as never) as string | string[] | undefined;
  const dispatch = useDispatchAction(node, scope);

  const [selected, setSelected] = useState<string[]>(
    Array.isArray(initialValue) ? initialValue : initialValue ? [initialValue] : [],
  );

  const toggle = (value: string) => {
    const next = isMultiple
      ? selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
      : [value];
    setSelected(next);
    void dispatch({ value: isMultiple ? next : next[0] });
  };

  return (
    <View style={styles.wrapper}>
      {label && <RNText style={styles.label}>{label}</RNText>}
      <View style={styles.chips}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <AnimatedPressable
              key={option.value}
              onPress={() => toggle(option.value)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <RNText style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{option.label}</RNText>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text.secondary },
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
  chipLabel: { ...typography.bodyStrong, color: colors.text.primary },
  chipLabelSelected: { color: colors.text.onBrand },
});
