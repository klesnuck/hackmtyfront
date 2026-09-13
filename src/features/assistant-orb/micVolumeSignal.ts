import { makeMutable, type SharedValue } from 'react-native-reanimated';

/**
 * Module-level bridge from `useSpeechToText`'s native `volumechange` events
 * (the mic session `expo-speech-recognition` already owns while listening)
 * to the orb's Skia worklets, which live in a different component. A plain
 * React prop/context can't carry this without round-tripping through the JS
 * thread on every frame — `makeMutable` gives a UI-thread-readable shared
 * value that either side can write/read without being related in the tree.
 */
export const micVolumeSignal: SharedValue<number> = makeMutable(0);
