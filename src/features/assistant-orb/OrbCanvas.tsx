import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurMask, Canvas, Circle, Group, Points, useClock } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { fibonacciSphere, mixColor } from './particleSphere';
import { useOrbAmplitude } from './useOrbAmplitude';

// Keep in sync with AnimatedOrb.tsx's own ORB_SIZE constant — that file
// can't statically import this one (see AnimatedOrb.tsx's top comment), so
// the value is duplicated there rather than shared.
const ORB_SIZE = 200;
const PARTICLE_COUNT = 2000;
const BASE_COLOR = '#9AA5C0';
const ACTIVE_COLOR = '#D6DEEE';
const GLOW_COLOR = '#B8C2D9';
const IDLE_SPEED = 0.00035;

/**
 * Voice-reactive particle orb: a Fibonacci-sphere point cloud rendered with
 * Skia's `<Points>` (one draw call for thousands of points), animated
 * entirely in `useDerivedValue` worklets on the UI thread via `useClock` —
 * no manual Reanimated `withRepeat` start/stop bookkeeping, so the animation
 * simply stops when the Canvas unmounts with the idle screen.
 *
 * `isListening` gates `useOrbAmplitude`, which reads the mic level from
 * whichever session is already open (native: `expo-speech-recognition`'s
 * own mic via `micVolumeSignal`; web: its own `AnalyserNode`) — never a
 * second capture.
 *
 * Kept separate from `AnimatedOrb.tsx` (the platform entry point) because
 * this file statically imports `@shopify/react-native-skia`. On web that
 * import must not evaluate before `LoadSkiaWeb()` resolves — Skia's web
 * CanvasKit-WASM binding is captured once, at require-time — so
 * `AnimatedOrb.tsx` only `require()`s this module after that load finishes.
 */
export function OrbCanvas({ isListening = false }: { isListening?: boolean }) {
  const amplitude = useOrbAmplitude(isListening);
  const clock = useClock();

  // Kept smaller than half the canvas so audio spikes have room to poke
  // outward without ever reaching the edge of the Canvas — Skia clips its
  // own pixels at its bounds, so anything larger gets cut off.
  const R = ORB_SIZE * 0.28;
  const cx = ORB_SIZE / 2;
  const cy = ORB_SIZE / 2;

  const sphere = useMemo(() => fibonacciSphere(PARTICLE_COUNT), []);
  // Deterministic per-particle "personality" so each point breathes/reacts
  // slightly out of phase with its neighbors, instead of pulsing in lockstep.
  const seeds = useMemo(() => sphere.map((_, i) => ((i * 12.9898) % 1000) / 1000), [sphere]);
  // Persists across frames (mutated in place, not reallocated) so each
  // particle's bulge has its own memory: it can pop outward fast and then
  // ease back slowly, instead of snapping directly to the noise field.
  const bulgeState = useMemo(() => new Float32Array(PARTICLE_COUNT), []);

  const points = useDerivedValue(() => {
    const t = clock.value;
    const amp = amplitude.value;

    // Rotation speed stays constant regardless of amplitude — sound should
    // make the orb visibly warp, not spin faster.
    const rotY = t * IDLE_SPEED * 0.8;
    const rotX = Math.sin(t * 0.00012) * 0.35;
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    const out = new Array(sphere.length);
    for (let i = 0; i < sphere.length; i++) {
      const p = sphere[i];

      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;
      const y1 = p.y;

      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      const seed = seeds[i];
      const breathe = 1 + 0.05 * Math.sin(t * 0.002 + seed * 20);

      // Smooth, spatially-coherent bulge field: driven by raw xyz position
      // (not per-particle seed noise), so neighboring particles rise and
      // fall together into a handful of rounded bulges instead of scattered
      // individual points poking out like needles.
      const field1 =
        Math.sin(p.x * 2.4 + t * 0.005) * Math.sin(p.y * 2.0 - t * 0.004) * Math.sin(p.z * 2.6 + t * 0.006);
      const field2 = Math.sin(p.x * 3.4 - t * 0.007 + 1.7) * Math.sin(p.z * 3.0 + t * 0.0045);
      const bump1 = Math.pow(Math.max(0, field1), 3);
      const bump2 = Math.pow(Math.max(0, field2), 3) * 0.8;
      const targetBulge = Math.max(bump1, bump2) * amp;

      // Fast attack / slow release per particle: pops out quickly when the
      // target rises, glides back down slowly when it falls.
      const prevBulge = bulgeState[i];
      const bulgeRate = targetBulge > prevBulge ? 0.45 : 0.05;
      const bulge = prevBulge + (targetBulge - prevBulge) * bulgeRate;
      bulgeState[i] = bulge;

      const deform = 1 + bulge * 0.8;
      const radius = R * breathe * deform;

      const persp = 2.4 / (2.4 + z2);
      out[i] = { x: cx + x1 * radius * persp, y: cy + y2 * radius * persp };
    }
    return out;
  }, [sphere, seeds, amplitude, clock]);

  // Mixes toward ACTIVE_COLOR gradually and caps short of full saturation
  // even at amp=1, so it never fully loses the resting brand hue.
  const color = useDerivedValue(() => mixColor(BASE_COLOR, ACTIVE_COLOR, amplitude.value * 0.7), [amplitude]);

  const glowOpacity = useDerivedValue(() => 0.12 + amplitude.value * 0.14, [amplitude]);
  const corePointSize = useDerivedValue(() => 1.4 + amplitude.value * 1.0, [amplitude]);
  const glowPointSize = useDerivedValue(() => 1.3 + amplitude.value * 1.6, [amplitude]);
  const glowLayerOpacity = useDerivedValue(() => 0.18 + amplitude.value * 0.18, [amplitude]);

  return (
    <View style={styles.container} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Soft energy core behind the particles */}
        <Circle cx={cx} cy={cy} r={R * 0.55} color={GLOW_COLOR} opacity={glowOpacity}>
          <BlurMask blur={22} style="normal" />
        </Circle>

        {/* Blurred back layer -> gives the particle cloud a glow/bloom feel */}
        <Group>
          <BlurMask blur={4} style="normal" />
          <Points
            points={points}
            mode="points"
            style="stroke"
            strokeWidth={glowPointSize}
            color={color}
            opacity={glowLayerOpacity}
          />
        </Group>

        {/* Crisp front layer -> the actual particle detail */}
        <Points points={points} mode="points" style="stroke" strokeWidth={corePointSize} color={color} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
