import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
// Legacy shim (still shipped in SDK 57 as of this writing) — the new `File`
// class's base64 read path wasn't confirmed stable enough to depend on for a
// hackathon build; readAsStringAsync is the well-documented, stable one.
// Revisit if expo-file-system drops the legacy export in a future SDK.
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { useCallback, useRef, useState } from 'react';
import { useUiStore } from '../../state/ui.store';

export type VoiceRecorderState = 'idle' | 'requesting-permission' | 'recording' | 'processing';

/**
 * Mic capture for REQ-ACC-03/04: record -> base64 -> POST /api/message
 * (src/api/endpoints.ts's sendMessage). See MOBILE_ARCHITECTURE.md §7.
 */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<VoiceRecorderState>('idle');
  const setRecordingFlag = useUiStore((s) => s.setRecording);
  const permissionRequested = useRef(false);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setState('requesting-permission');

    if (!permissionRequested.current) {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      permissionRequested.current = true;
      if (!permission.granted) {
        setState('idle');
        throw new Error('Microphone permission denied');
      }
    }

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setState('recording');
    setRecordingFlag(true);
  }, [recorder, state, setRecordingFlag]);

  const stop = useCallback(async (): Promise<string | null> => {
    if (state !== 'recording') return null;
    setState('processing');
    setRecordingFlag(false);

    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) {
      setState('idle');
      return null;
    }

    const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    setState('idle');
    return base64;
  }, [recorder, state, setRecordingFlag]);

  return { state, isRecording: state === 'recording', start, stop };
}
