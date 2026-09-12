import { useCallback, useRef, useState } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useUiStore } from '../../state/ui.store';

export type SpeechToTextState = 'idle' | 'requesting-permission' | 'listening' | 'processing';

/** Spanish (Mexico) — matches the assistant's other Spanish-language surfaces. */
const RECOGNITION_LANGUAGE = 'es-MX';

/**
 * Mic capture for the Asistente IA screen: on-device speech-to-text via
 * `expo-speech-recognition` (replaces the old expo-audio record -> base64 ->
 * `audio_b64` upload pipeline in `useVoiceRecorder.ts`). The finalized
 * transcript is submitted through the same text path as typed messages
 * (`submitText`) — see openspec/changes/add-assistant-voice-transcription.
 */
export function useSpeechToText() {
  const [state, setState] = useState<SpeechToTextState>('idle');
  const [partialText, setPartialText] = useState('');
  const setRecordingFlag = useUiStore((s) => s.setRecording);

  const permissionRequested = useRef(false);
  const finalTranscriptRef = useRef<string | null>(null);
  const startWaiterRef = useRef<{ resolve: () => void; reject: (error: Error) => void } | null>(null);
  const stopWaiterRef = useRef<((transcript: string | null) => void) | null>(null);

  useSpeechRecognitionEvent('start', () => {
    startWaiterRef.current?.resolve();
    startWaiterRef.current = null;
    setState('listening');
    setRecordingFlag(true);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (event.isFinal) {
      finalTranscriptRef.current = transcript;
    } else {
      setPartialText(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (startWaiterRef.current) {
      startWaiterRef.current.reject(new Error(event.message || event.error));
      startWaiterRef.current = null;
      setState('idle');
      setRecordingFlag(false);
    }
    // If the error happens mid-listening (e.g. network drop), the native
    // 'end' event still fires right after and resolves `stop()`'s promise
    // below with whatever transcript (if any) was captured so far.
  });

  useSpeechRecognitionEvent('end', () => {
    setState('idle');
    setPartialText('');
    setRecordingFlag(false);

    const resolveStop = stopWaiterRef.current;
    stopWaiterRef.current = null;
    const transcript = finalTranscriptRef.current?.trim();
    finalTranscriptRef.current = null;
    resolveStop?.(transcript ? transcript : null);
  });

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setState('requesting-permission');

    if (!permissionRequested.current) {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      permissionRequested.current = true;
      if (!permission.granted) {
        setState('idle');
        throw new Error('Microphone/speech recognition permission denied');
      }
    }

    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      setState('idle');
      throw new Error('Speech recognition unavailable on this device');
    }

    finalTranscriptRef.current = null;
    setPartialText('');

    await new Promise<void>((resolve, reject) => {
      startWaiterRef.current = { resolve, reject };
      ExpoSpeechRecognitionModule.start({
        lang: RECOGNITION_LANGUAGE,
        interimResults: true,
        continuous: false,
      });
    });
  }, [state]);

  const stop = useCallback((): Promise<string | null> => {
    if (state !== 'listening') return Promise.resolve(null);
    setState('processing');

    return new Promise<string | null>((resolve) => {
      stopWaiterRef.current = resolve;
      ExpoSpeechRecognitionModule.stop();
    });
  }, [state]);

  return { state, isListening: state === 'listening', partialText, start, stop };
}
