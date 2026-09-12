import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/tokens';
import { recordingPulseDurationMs } from '../../theme/motion';

/** The expanding ring behind the mic button while recording (REQ-ACC-03/04). */
export function RecordingPulse({ active }: { active: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withRepeat(
        withTiming(1, { duration: recordingPulseDurationMs, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(progress);
      progress.value = withTiming(0, { duration: 150 });
    }
  }, [active, progress]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.8 }],
    opacity: (1 - progress.value) * 0.5,
  }));

  if (!active) return null;
  return <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />;
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.primary,
  },
});
