import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/**
 * Central animation vocabulary for the whole app, built directly on
 * react-native-reanimated v4 (bundled with Expo SDK 57, New Architecture only).
 *
 * We deliberately do NOT use a wrapper library (e.g. Moti): at the time this was
 * written Moti's compatibility with Reanimated v4/react-native-worklets was
 * unconfirmed, and Reanimated's own API (useSharedValue, useAnimatedStyle,
 * withSpring/withTiming, and the built-in entering/exiting presets like
 * FadeIn/SlideInDown) is already declarative enough that a wrapper buys little.
 * Using it directly is also the lower-risk choice for a 24h build — one fewer
 * native dependency whose version compatibility could break a build.
 *
 * Everything animated in the app should reuse these presets instead of
 * hand-rolling spring/timing configs inline, so motion feels consistent.
 */

export const springs = {
  /** Default for most UI: button press, card entrance, sheet open. */
  gentle: { damping: 18, stiffness: 220, mass: 0.9 } satisfies WithSpringConfig,
  /** Snappier — small controls, toggles, icon state changes. */
  snappy: { damping: 20, stiffness: 320, mass: 0.7 } satisfies WithSpringConfig,
  /** Playful overshoot — the mic button, success confirmations. */
  bouncy: { damping: 12, stiffness: 200, mass: 0.9 } satisfies WithSpringConfig,
} as const;

export const timings = {
  fast: { duration: 150, easing: Easing.out(Easing.cubic) } satisfies WithTimingConfig,
  base: { duration: 250, easing: Easing.out(Easing.cubic) } satisfies WithTimingConfig,
  slow: { duration: 400, easing: Easing.inOut(Easing.cubic) } satisfies WithTimingConfig,
} as const;

/** Scale applied to pressable surfaces (buttons, cards, catalog Button) while pressed. */
export const pressScale = {
  from: 1,
  to: 0.96,
} as const;

/** Duration for one cycle of the voice-recording pulse (features/voice). Ralentizado for a smooth Siri-style pulse. */
export const recordingPulseDurationMs = 2400;

