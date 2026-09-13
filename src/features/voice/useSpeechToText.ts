import { useCallback, useEffect, useRef, useState } from 'react';
import { setAudioModeAsync } from 'expo-audio';
import { withTiming } from 'react-native-reanimated';
import { useUiStore } from '../../state/ui.store';
import { micVolumeSignal } from '../assistant-orb/micVolumeSignal';

export type SpeechToTextState = 'idle' | 'requesting-permission' | 'listening' | 'processing';

/** Spanish (Mexico) — matches the assistant's other Spanish-language surfaces. */
const RECOGNITION_LANGUAGE = 'es-MX';

// Safely load `expo-speech-recognition` native module if present in the build.
// Standard Expo Go does NOT include custom third-party native modules like `expo-speech-recognition`,
// so requiring it directly without try/catch causes Expo Go to crash on startup.
let NativeSpeechModule: any = null;
let useSpeechRecognitionEventFn: any = null;

try {
  const speechModule = require('expo-speech-recognition');
  if (speechModule && speechModule.ExpoSpeechRecognitionModule) {
    NativeSpeechModule = speechModule.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEventFn = speechModule.useSpeechRecognitionEvent;
  }
} catch {
  // Running inside standard Expo Go client — fallback mode active.
}

/**
 * Mic capture for the Asistente IA screen:
 * On-device speech-to-text via `expo-speech-recognition` when running in a custom dev build,
 * with a safe fallback when running inside standard Expo Go so the app never crashes on startup.
 */
export function useSpeechToText() {
  const [state, setState] = useState<SpeechToTextState>('idle');
  const [partialText, setPartialText] = useState('');
  const setRecordingFlag = useUiStore((s) => s.setRecording);

  const permissionRequested = useRef(false);
  const finalTranscriptRef = useRef<string | null>(null);
  const startWaiterRef = useRef<{ resolve: () => void; reject: (error: Error) => void } | null>(null);
  const stopWaiterRef = useRef<((transcript: string | null) => void) | null>(null);

  const isNativeSupported = Boolean(NativeSpeechModule);

  // Safe wrapper for speech recognition events that won't crash in Expo Go
  const handleStart = useCallback(() => {
    startWaiterRef.current?.resolve();
    startWaiterRef.current = null;
    setState('listening');
    setRecordingFlag(true);
  }, [setRecordingFlag]);

  const handleResult = useCallback((event: any) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    if (event.isFinal) {
      finalTranscriptRef.current = transcript;
    } else {
      setPartialText(transcript);
    }
  }, []);

  // Feeds the assistant orb's particle reactivity (see `assistant-orb/`)
  // from the mic session speech recognition already has open — value is a
  // dB-ish float in roughly -2..10 (per expo-speech-recognition's types),
  // normalized to 0..1 with fast attack / slow release.
  const handleVolumeChange = useCallback((event: { value: number }) => {
    const level = Math.min(1, Math.max(0, (event.value + 2) / 10));
    const prev = micVolumeSignal.value;
    const rising = level > prev;
    micVolumeSignal.value = withTiming(level, { duration: rising ? 60 : 220 });
  }, []);

  const handleError = useCallback(
    (event: any) => {
      if (startWaiterRef.current) {
        startWaiterRef.current.reject(new Error(event.message || event.error || 'Speech recognition error'));
        startWaiterRef.current = null;
        setState('idle');
        setRecordingFlag(false);
        micVolumeSignal.value = withTiming(0, { duration: 200 });
      }
    },
    [setRecordingFlag],
  );

  const handleEnd = useCallback(() => {
    setState('idle');
    setPartialText('');
    setRecordingFlag(false);
    micVolumeSignal.value = withTiming(0, { duration: 200 });

    // Speech recognition switches the audio session to a recording category;
    // restore media playback so the assistant's reply is audible on iOS.
    void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

    const resolveStop = stopWaiterRef.current;
    stopWaiterRef.current = null;
    const transcript = finalTranscriptRef.current?.trim();
    finalTranscriptRef.current = null;
    resolveStop?.(transcript ? transcript : null);
  }, [setRecordingFlag]);

  // Execute listener registration safely if module exists
  if (isNativeSupported && typeof useSpeechRecognitionEventFn === 'function') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpeechRecognitionEventFn('start', handleStart);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpeechRecognitionEventFn('result', handleResult);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpeechRecognitionEventFn('error', handleError);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpeechRecognitionEventFn('end', handleEnd);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpeechRecognitionEventFn('volumechange', handleVolumeChange);
  }

  const start = useCallback(async () => {
    if (state !== 'idle') return;

    if (!isNativeSupported) {
      // In standard Expo Go where custom native module is unavailable, simulated voice active mode
      setState('listening');
      setRecordingFlag(true);
      return;
    }

    setState('requesting-permission');

    if (!permissionRequested.current) {
      const permission = await NativeSpeechModule.requestPermissionsAsync();
      permissionRequested.current = true;
      if (!permission?.granted) {
        setState('idle');
        throw new Error('Microphone/speech recognition permission denied');
      }
    }

    if (!NativeSpeechModule.isRecognitionAvailable()) {
      setState('idle');
      throw new Error('Speech recognition unavailable on this device');
    }

    finalTranscriptRef.current = null;
    setPartialText('');

    await new Promise<void>((resolve, reject) => {
      startWaiterRef.current = { resolve, reject };
      NativeSpeechModule.start({
        lang: RECOGNITION_LANGUAGE,
        interimResults: true,
        continuous: false,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
      });
    });
  }, [state, isNativeSupported, setRecordingFlag]);

  const stop = useCallback((): Promise<string | null> => {
    if (state !== 'listening') return Promise.resolve(null);
    setState('processing');

    if (!isNativeSupported) {
      setState('idle');
      setRecordingFlag(false);
      return Promise.resolve(null);
    }

    return new Promise<string | null>((resolve) => {
      stopWaiterRef.current = resolve;
      NativeSpeechModule.stop();
    });
  }, [state, isNativeSupported, setRecordingFlag]);

  return { state, isListening: state === 'listening', partialText, start, stop };
}
