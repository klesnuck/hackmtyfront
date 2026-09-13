import { useDerivedValue } from 'react-native-reanimated';
import { micVolumeSignal } from './micVolumeSignal';

/**
 * Native (iOS/Android): reads the mic level `useSpeechToText` already writes
 * into `micVolumeSignal` from `expo-speech-recognition`'s `volumechange`
 * event — the mic session it opens while listening. Does not open a second
 * audio capture: `expo-speech-recognition` already owns the mic during
 * recognition, and running a parallel `expo-audio` recorder risks fighting
 * it for the native audio session.
 */
export function useOrbAmplitude(isListening: boolean) {
  return useDerivedValue(() => (isListening ? micVolumeSignal.value : 0), [isListening]);
}
