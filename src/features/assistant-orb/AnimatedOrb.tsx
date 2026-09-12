import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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

const ORB_SIZE = 160;

/**
 * Clean, minimal fluid sphere with a subtle, gentle breathing animation.
 * Free of inner spots or hard overlapping circles.
 */
export function AnimatedOrb({ isListening = false }: { isListening?: boolean }) {
  const breath = useSharedValue(0);
  const slowRotate = useSharedValue(0);

  useEffect(() => {
    // Gentle breathing cycle (3 seconds smooth sinusoid)
    breath.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    // Continuous slow background rotation for dynamic gradient movement
    slowRotate.value = withRepeat(
      withTiming(1, { duration: 24000, easing: Easing.linear }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(breath);
      cancelAnimation(slowRotate);
    };
  }, [breath, slowRotate, isListening]);

  // Subtle, gentle scale breathing (0.98 to 1.02 when idle, up to 1.04 when speaking)
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const maxScaleAdd = isListening ? 0.04 : 0.02;
    const scale = 0.98 + breath.value * maxScaleAdd;

    return {
      transform: [{ scale }],
    };
  });

  // Soft rotation of the gradient
  const orbGradientStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${slowRotate.value * 360}deg` }],
    };
  });

  // Subtle outer aura glow opacity breathing
  const auraGlowStyle = useAnimatedStyle(() => {
    const opacity = isListening ? 0.65 + breath.value * 0.15 : 0.4 + breath.value * 0.1;
    const scale = 1.06 + breath.value * 0.03;

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]} pointerEvents="none">
      {/* Soft outer glow aura layer (turquoise) */}
      <Animated.View style={[styles.auraGlow, auraGlowStyle]}>
        <LinearGradient
          colors={['#00F2FE', '#00D2FF', '#00C6FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fullGradient}
        />
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Clean single fluid orb core (turquoise) */}
      <Animated.View style={styles.orbCore}>
        <Animated.View style={[styles.fullGradient, orbGradientStyle]}>
          <LinearGradient
            colors={['#E0FFFF', '#00F2FE', '#4FACFE', '#0B2545']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.fullGradient}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraGlow: {
    ...StyleSheet.absoluteFill,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden',
  },
  orbCore: {
    width: ORB_SIZE * 0.88,
    height: ORB_SIZE * 0.88,
    borderRadius: (ORB_SIZE * 0.88) / 2,
    overflow: 'hidden',
    shadowColor: '#00F2FE',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  fullGradient: {
    width: '100%',
    height: '100%',
  },
});


