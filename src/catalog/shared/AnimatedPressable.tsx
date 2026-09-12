import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { pressScale, springs } from '../../theme/motion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Disable the press-scale animation (e.g. for large surfaces where it reads as laggy). */
  disableScaleEffect?: boolean;
};

/**
 * The one place "press feedback" is implemented. Every interactive catalog
 * component (Button, Card, ChoicePicker option, ...) should be built on this
 * instead of a bare Pressable, so press feedback feels the same everywhere.
 */
export function AnimatedPressable({
  children,
  style,
  disableScaleEffect,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue<number>(pressScale.from);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      style={[disableScaleEffect ? undefined : animatedStyle, style]}
      onPressIn={(e) => {
        if (!disableScaleEffect) scale.value = withSpring(pressScale.to, springs.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!disableScaleEffect) scale.value = withSpring(pressScale.from, springs.gentle);
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
}
