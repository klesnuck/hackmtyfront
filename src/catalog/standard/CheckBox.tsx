import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useDispatchAction, useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicBoolean, DynamicString } from '../../a2ui/types';
import { springs } from '../../theme/motion';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { AnimatedPressable } from '../shared/AnimatedPressable';

export function CheckBox({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const label = resolve(node.label as DynamicString);
  const initialValue = resolve(node.value as DynamicBoolean) ?? false;
  const dispatch = useDispatchAction(node, scope);

  const [checked, setChecked] = useState(initialValue);
  const progress = useSharedValue(initialValue ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, springs.snappy);
  }, [checked, progress]);

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value > 0.5 ? colors.brand.primary : colors.surface.field,
    borderColor: progress.value > 0.5 ? colors.brand.primary : colors.border.strong,
  }));

  const toggle = () => {
    const next = !checked;
    setChecked(next);
    void dispatch({ value: next });
  };

  return (
    <AnimatedPressable onPress={toggle} disableScaleEffect style={styles.row}>
      <Animated.View style={[styles.box, boxStyle]}>
        {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
      </Animated.View>
      {label && <RNText style={styles.label}>{label}</RNText>}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.body, color: colors.text.primary },
});
