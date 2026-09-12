import { useState } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDispatchAction, useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicNumber, DynamicString } from '../../a2ui/types';
import { springs } from '../../theme/motion';
import { colors, spacing, typography } from '../../theme/tokens';

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 6;

export function Slider({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const label = resolve(node.label as DynamicString);
  const min = resolve(node.min as DynamicNumber) ?? 0;
  const max = resolve(node.max as DynamicNumber) ?? 100;
  const initialValue = resolve(node.value as DynamicNumber) ?? min;
  const dispatch = useDispatchAction(node, scope);

  const [trackWidth, setTrackWidth] = useState(0);
  const [displayValue, setDisplayValue] = useState(initialValue);
  const valueToX = (v: number) => (trackWidth <= 0 ? 0 : ((v - min) / (max - min)) * trackWidth);
  const x = useSharedValue(0);

  const commitValue = (nextX: number) => {
    const ratio = trackWidth <= 0 ? 0 : nextX / trackWidth;
    const raw = min + ratio * (max - min);
    const rounded = Math.round(raw);
    setDisplayValue(rounded);
    void dispatch({ value: rounded });
  };

  const pan = Gesture.Pan()
    .onChange((e) => {
      const next = Math.min(Math.max(x.value + e.changeX, 0), trackWidth);
      x.value = next;
    })
    .onFinalize(() => {
      x.value = withSpring(x.value, springs.snappy);
      runOnJS(commitValue)(x.value);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - THUMB_SIZE / 2 }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: x.value }));

  return (
    <View style={styles.wrapper}>
      {label && <RNText style={styles.label}>{label}</RNText>}
      <View
        style={styles.track}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          x.value = valueToX(displayValue);
        }}
      >
        <Animated.View style={[styles.fill, fillStyle]} />
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </GestureDetector>
      </View>
      <RNText style={styles.value}>{displayValue}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text.secondary },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.border.subtle,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.brand.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.surface.card,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  value: { ...typography.caption, color: colors.text.secondary, alignSelf: 'flex-end' },
});
