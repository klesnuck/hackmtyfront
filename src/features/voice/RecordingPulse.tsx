import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { recordingPulseDurationMs } from '../../theme/motion';

/** Siri-style expanding dual glowing ring behind the mic button while recording (ralentizado). */
export function RecordingPulse({ active }: { active: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withRepeat(
        withTiming(1, { duration: recordingPulseDurationMs, easing: Easing.inOut(Easing.sin) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(progress);
      progress.value = withTiming(0, { duration: 250 });
    }
  }, [active, progress]);

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.75 }],
    opacity: (1 - progress.value) * 0.65,
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 1.15 }],
    opacity: (1 - progress.value) * 0.4,
  }));

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View style={[styles.outerGlowRing, outerRingStyle]} />
      <Animated.View style={[styles.innerRing, innerRingStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#00F2FE',
    shadowColor: '#00F2FE',
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  outerGlowRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FF007F',
    shadowColor: '#FF007F',
    shadowOpacity: 0.7,
    shadowRadius: 24,
  },
});

