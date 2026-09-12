## 1. Dependency & native config

- [x] 1.1 Add `expo-speech-recognition` to `package.json` dependencies.
- [x] 1.2 Register `'expo-speech-recognition'` in `app.config.ts`'s `plugins`, with explicit iOS microphone/speech-recognition usage-description strings (this file currently defines no custom `ios.infoPlist` strings for any plugin).
- [ ] 1.3 Run `expo prebuild` (or trigger a fresh `eas build --profile development`) and install the resulting dev client build — confirm the app still boots and the existing `expo-audio` TTS playback path (`audioCache.ts`) still works unaffected. **MANUAL — not executable in this environment; see final report.**

## 2. Speech-to-text hook

- [x] 2.1 Create `src/features/voice/useSpeechToText.ts` exposing `{ state: 'idle' | 'requesting-permission' | 'listening' | 'processing', isListening, partialText, start(), stop(): Promise<string | null> }`, using `expo-speech-recognition`'s `start`/`stop`/result-listener API, language `es-MX`, requesting mic + speech-recognition permission once per session (mirrors `useVoiceRecorder.ts`'s existing permission-once pattern).
- [x] 2.2 Handle "recognition unavailable on this device" (e.g. Android without the Google app) the same way as permission-denied: surface a system message, don't start listening, don't crash.
- [x] 2.3 Delete `src/features/voice/useVoiceRecorder.ts` once `asistente.tsx` no longer references it.

## 3. Wire the mic button to the new hook

- [x] 3.1 In `app/(tabs)/asistente.tsx`, replace `useVoiceRecorder()` with `useSpeechToText()`; update `handleMicPress` so stop resolves to transcript text and, if non-empty, calls `submitText(transcript)` directly.
- [x] 3.2 Delete `submitAudio` and the `'🎤 Mensaje de voz'` literal; remove the `audio_b64` call site (leave `MessageRequest`'s `audio_b64` union member and `sendMessage`/`endpoints.ts` untouched for other callers).
- [x] 3.3 Pass `isListening` (renamed from `isRecording`) into `RecordingPulse` and the big mic button's active-state styling; update `handleHablar` to start listening the same way it previously started recording.
- [x] 3.4 Show the live partial transcript somewhere near the mic button while listening (e.g. replacing the idle subtitle or input placeholder area) so speech-in-progress is visible before the user stops.

## 4. Layout: fixed header vs. scrollable history

- [x] 4.1 Move the orb/greeting/mic-button/input-pill block (currently the FlatList's `ListHeaderComponent`) out into a sibling `View` rendered above the turns `FlatList`, per design.md decision 4.
- [x] 4.2 Give the turns `FlatList` `style={{ flex: 1 }}` (no `ListHeaderComponent`), so it fills remaining space below the fixed section and scrolls only its own items.
- [x] 4.3 Verify `scrollToEnd` on new turns still works, and that the fixed section never moves regardless of `KeyboardAvoidingView`/keyboard state.
- [x] 4.4 Remove now-dead styles if any became unused after the header move (check `idleHeaderSection`, `turnsContainer`, and the pre-existing unused `inputBar`/`micButton`/`textInput`/`sendButton`/`EmptyState` styles noted during exploration — only remove what's confirmed unused, don't touch unrelated dead code out of scope for this change).

## 5. Manual verification

**MANUAL — requires a real device/dev-client build; not executable in this environment. A code-level self-check of the implementation was done in its place (see final report); these boxes stay unchecked until a human verifies on-device.**

- [ ] 5.1 On a fresh dev client build, press the mic, speak a short phrase in Spanish, confirm the live partial transcript appears and the finalized text shows as a real user chat bubble (not "Mensaje de voz").
- [ ] 5.2 Deny mic/speech permission and confirm the existing "no se pudo acceder" system-message behavior still triggers without crashing.
- [ ] 5.3 Send/accumulate enough turns (or a few long ones) to overflow the screen and confirm only the message history scrolls — the orb, greeting, mic button, and input pill stay fixed in view throughout.
- [ ] 5.4 Confirm a short conversation (fits on screen) shows no scrolling at all.
- [ ] 5.5 Confirm typed messages (the existing text-input path) and assistant/agent replies (A2UI surfaces, TTS playback) still work exactly as before — this change should be invisible to that path.
