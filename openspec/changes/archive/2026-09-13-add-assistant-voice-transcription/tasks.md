## 1. Dependency & native config

- [x] 1.1 Add `expo-speech-recognition` to `package.json` dependencies.
- [x] 1.2 Register `'expo-speech-recognition'` in `app.config.ts`'s `plugins`, with explicit iOS microphone/speech-recognition usage-description strings (this file currently defines no custom `ios.infoPlist` strings for any plugin).
- [ ] 1.3 Run `expo prebuild` (or trigger a fresh `eas build --profile development`) and install the resulting dev client build — confirm the app still boots and the existing `expo-audio` TTS playback path (`audioCache.ts`) still works unaffected. **MANUAL — not executable in this environment.**

## 2. Speech-to-text hook

- [x] 2.1 Create `src/features/voice/useSpeechToText.ts` exposing `{ state: 'idle' | 'requesting-permission' | 'listening' | 'processing', isListening, partialText, start(), stop(): Promise<string | null> }`, using `expo-speech-recognition`'s `start`/`stop`/result-listener API, language `es-MX`, requesting mic + speech-recognition permission once per session (mirrors `useVoiceRecorder.ts`'s existing permission-once pattern).
- [x] 2.2 Handle "recognition unavailable on this device" the same way as permission-denied: surface an unavailable state, don't start listening, don't crash.
- [x] 2.3 Delete `src/features/voice/useVoiceRecorder.ts` once `asistente.tsx` no longer references it.

## 3. Wire the mic button to the new hook

- [x] 3.1 In `app/(tabs)/asistente.tsx`, replace `useVoiceRecorder()` with `useSpeechToText()`; update the mic handlers so stop resolves to transcript text and, if non-empty, submits it through the text path.
- [x] 3.2 Delete the old `submitAudio` function and remove the `audio_b64` call site from this screen (leave `MessageRequest`'s `audio_b64` union member and `sendMessage`/`endpoints.ts` untouched for other callers).
- [x] 3.3 Pass `isListening` (renamed from `isRecording`) into `RecordingPulse` and the big mic button's active-state styling; update the voice entry to start listening the same way recording started before.
- [x] 3.4 Show the live partial transcript while listening (the idle subtitle) so speech-in-progress is visible before the user stops.

## 4. Superseded — screen layout

> The former "fixed header vs. scrollable chat history" task section is **superseded** by `replace-assistant-chat-with-fullscreen-generative-ui`, which removes the turn/history list entirely and renders the generated A2UI surface full-panel. No task is implemented here for it, and this change declares no `mobile/assistant` delta.

## 5. Manual verification

**MANUAL — requires a real device/dev-client build; not executable in this environment. These boxes stay unchecked until a human verifies on-device.**

- [ ] 5.1 On a fresh dev client build, press the mic, speak a short phrase in Spanish, confirm the live partial transcript appears and the finalized text is sent as a turn (no `audio_b64` upload).
- [ ] 5.2 Deny mic/speech permission and confirm the unavailable behavior triggers without crashing.
- [ ] 5.3 Confirm typed messages (the existing text-input path) and assistant/agent replies (A2UI surfaces, TTS playback) still work exactly as before — this change should be invisible to that path.
