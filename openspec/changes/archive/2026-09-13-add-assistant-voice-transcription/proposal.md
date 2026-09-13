## Why

Today, pressing the mic on the Soporte IA (Asistente) screen records audio with `expo-audio`, base64-encodes the whole file, and uploads it via `POST /api/message`'s `audio_b64` field, so every voice turn depends on the backend to transcribe audio before it can act on it. Doing speech-to-text on-device instead removes that upload+server-transcription hop entirely (cheaper, faster) and lets the user's recognized words reach the agent as text.

## What Changes

- Replace the mic button's `expo-audio` record → base64 → `audio_b64` upload pipeline with on-device Spanish (`es-MX`) speech-to-text via the `expo-speech-recognition` library. **BREAKING** (build-time): this library ships a config plugin with native code, so the app can no longer run in Expo Go — it requires the dev client build already configured in `eas.json`'s `development` profile.
- The mic button shows a live partial transcript while listening; on stop, the finalized text is submitted through the existing text path (`sendMessage({ session_id, text })`) — the same call typed input already uses, so no backend contract change and no new `audio_b64` traffic from this screen.
- **Superseded layout**: an earlier revision of this change also proposed a fixed orb/greeting/mic header with a scrolling chat history. That direction is replaced by `replace-assistant-chat-with-fullscreen-generative-ui` (the generated A2UI surface takes over the screen; there is no turn/history list and no user-text bubbles). This change no longer declares any `mobile/assistant` delta.
- The AI's reply side is unaffected — agent replies still render however the response resolves (existing A2UI surface rendering).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `mobile/voice`: replaces the "record with expo-audio, upload as `audio_b64`" requirement with on-device speech recognition that submits recognized text through the existing text-message path.

## Impact

- **Affected code**: `hackmtyfront/src/features/voice/useVoiceRecorder.ts` (replaced by `useSpeechToText`), `hackmtyfront/app/(tabs)/asistente.tsx` (mic wiring; the transcript is submitted via the same text path), `hackmtyfront/app.config.ts` (plugin entry + permission strings), `hackmtyfront/src/features/voice/useSpeechToText.ts` (new hook).
- **New dependency**: `expo-speech-recognition` (community package), added to `package.json` and `app.config.ts`'s `plugins`.
- **Native build**: requires `expo prebuild`/a new dev-client build (`eas build --profile development`) before this can run on-device — it will not work under `expo start` + Expo Go.
- **API contract**: unchanged (`MessageRequest`'s `audio_b64` variant stays in `src/api/types.ts`/`endpoints.ts` for any other caller; this screen simply stops using it).
- **Superseded by**: `replace-assistant-chat-with-fullscreen-generative-ui` for all screen-layout and transcript-display behavior. Do not re-apply the removed `mobile/assistant` delta.
- **Out of scope**: the assistant's (agent) reply content — driven entirely by whatever the response contains today.
