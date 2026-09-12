import { useState } from 'react';
import { StyleSheet, Text as RNText, TextInput, View } from 'react-native';
import { useDispatchAction, useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type Variant = 'text' | 'email' | 'password' | 'number';

export function TextField({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const label = resolve(node.label as DynamicString);
  const initialValue = resolve(node.value as DynamicString) ?? '';
  const variant = (node.variant as Variant | undefined) ?? 'text';
  const dispatch = useDispatchAction(node, scope);

  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.field}>
      {label && <RNText style={styles.label}>{label}</RNText>}
      <TextInput
        style={[styles.input, isFocused && styles.inputFocused]}
        value={value}
        onChangeText={setValue}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (value !== initialValue) void dispatch({ value });
        }}
        secureTextEntry={variant === 'password'}
        keyboardType={variant === 'email' ? 'email-address' : variant === 'number' ? 'numeric' : 'default'}
        autoCapitalize={variant === 'email' ? 'none' : 'sentences'}
        placeholderTextColor={colors.text.placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text.secondary },
  input: {
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
  },
  inputFocused: {
    borderColor: colors.brand.primary,
  },
});
