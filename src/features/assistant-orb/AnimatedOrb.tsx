import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

// Keep in sync with OrbCanvas.tsx's own ORB_SIZE — that file can't be
// statically imported here (it imports `@shopify/react-native-skia`, which
// must stay unevaluated until `LoadSkiaWeb()` resolves on web, see below),
// so the value is duplicated rather than shared.
const ORB_SIZE = 200;
const HALO_SIZE = ORB_SIZE * 1.6;
const GLOW_COLOR = '#AEB9D8';

type OrbCanvasComponent = React.ComponentType<{ isListening?: boolean }>;

/**
 * Platform entry point for the assistant orb. Delegates to `OrbCanvas`
 * (the actual Skia particle renderer) but only ever `require()`s that
 * module — which statically imports `@shopify/react-native-skia` — after
 * `LoadSkiaWeb()` resolves on web. Importing `OrbCanvas` eagerly at this
 * file's top level would evaluate Skia's web CanvasKit binding before the
 * WASM binary is loaded ("CanvasKit is not defined"), since that binding is
 * captured once, at require-time. Native has no such bootstrap step, so it
 * loads `OrbCanvas` immediately.
 *
 * Also renders the soft ambient halo behind the particle sphere — a
 * `react-native-svg` `RadialGradient` (a true radial falloff, unlike
 * `LinearGradient`) breathing gently via Reanimated, brighter while
 * listening. Kept outside `OrbCanvas`/Skia since it's simple, cheap, and
 * shows immediately even while the Skia canvas is still loading on web.
 */
export function AnimatedOrb({ isListening = false }: { isListening?: boolean }) {
  const [OrbCanvas, setOrbCanvas] = useState<OrbCanvasComponent | null>(null);
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breath);
  }, [breath]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (Platform.OS === 'web') {
        await LoadSkiaWeb({ locateFile: (file: string) => '/' + file });
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { OrbCanvas: Component } = require('./OrbCanvas');
      if (mounted) setOrbCanvas(() => Component);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const haloStyle = useAnimatedStyle(() => {
    const base = isListening ? 0.9 : 0.7;
    const swing = isListening ? 0.25 : 0.2;
    return {
      opacity: base + breath.value * swing,
      transform: [{ scale: 1 + breath.value * 0.08 }],
    };
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.halo, haloStyle]}>
        <Svg width={HALO_SIZE} height={HALO_SIZE}>
          <Defs>
            <RadialGradient id="orbHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#F5F8FF" stopOpacity={0.95} />
              <Stop offset="22%" stopColor={GLOW_COLOR} stopOpacity={0.75} />
              <Stop offset="55%" stopColor={GLOW_COLOR} stopOpacity={0.32} />
              <Stop offset="100%" stopColor={GLOW_COLOR} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={HALO_SIZE / 2} cy={HALO_SIZE / 2} r={HALO_SIZE / 2} fill="url(#orbHalo)" />
        </Svg>
      </Animated.View>

      {OrbCanvas ? <OrbCanvas isListening={isListening} /> : <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
  },
  placeholder: {
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
});
