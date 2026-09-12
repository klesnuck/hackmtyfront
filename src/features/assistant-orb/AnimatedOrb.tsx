import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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

const OUTER_SIZE = 180;
const INNER_SIZE = 140;

// Local to this component: Figma's orb (37:142/37:143) is a one-off
// purple/blue gradient with no equivalent in theme/tokens.ts's brand
// palette, and tokens.ts is owned by other lanes in this parallel build —
// not a general-purpose color worth adding there.
const OUTER_GLOW_COLOR = 'rgba(88,86,214,0.22)';
const GRADIENT_COLORS = ['#33489E', '#5856D6', '#8B6BF2', '#5856D6'] as const;

/**
 * The idle screen's "alive" orb (Figma node 37:123's orb-outer-glow /
 * orb-inner-glow). Hand-built on expo-linear-gradient + expo-blur +
 * reanimated per design.md's decision against react-native-magic-orb /
 * Skia (immaturity + new native dependency risk not worth it for a
 * hackathon build). A blurred outer glow sits behind a crisp, slowly
 * rotating gradient core; a breathing scale layers on top for the
 * "thinking/listening" feel. Mount/unmount this component with the idle
 * view — animations are cancelled on unmount so nothing runs off-screen.
 */
export function AnimatedOrb() {
  const breath = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    rotation.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);

    return () => {
      cancelAnimation(breath);
      cancelAnimation(rotation);
    };
  }, [breath, rotation]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + breath.value * 0.12 }, { rotate: `${rotation.value * 360}deg` }],
  }));

  return (
    <View style={styles.outer} pointerEvents="none">
      <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.core, coreStyle]}>
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={{ x: 0.12, y: 0.1 }}
          end={{ x: 0.9, y: 0.95 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    backgroundColor: OUTER_GLOW_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  core: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    overflow: 'hidden',
  },
  gradient: { width: '100%', height: '100%' },
});
