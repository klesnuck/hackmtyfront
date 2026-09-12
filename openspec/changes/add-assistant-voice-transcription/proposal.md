## Why

Today, pressing the mic on the Soporte IA (Asistente) screen records audio with `expo-audio`, base64-encodes the whole file, and uploads it via `POST /api/message`'s `audio_b64` field — the user's own words never appear anywhere in the UI (the chat just shows a hardcoded `"🎤 Mensaje de voz"` bubble), and every voice turn depends on the backend to transcribe audio before it can even act on it. Doing speech-to-text on-device instead removes that upload+server-transcription hop entirely (cheaper, faster, and it lets the user see what the assistant actually heard), and unblocks a real chat feel for the assistant ahead of the backend API being ready.

## What Changes

- Replace the mic button's `expo-audio` record → base64 → `audio_b64` upload pipeline with on-device Spanish (`es-MX`) speech-to-text via the `expo-speech-recognition` library. **BREAKING** (build-time): this library ships a config plugin with native code, so the app can no longer run in Expo Go — it requires the dev client build already configured in `eas.json`'s `development` profile.
- The mic button shows a live partial transcript while listening; on stop, the finalized text is appended as a normal user chat bubble (replacing the hardcoded `"🎤 Mensaje de voz"` text) and sent through the existing text path (`sendMessage({ session_id, text })`) — the same call `submitText` already makes, so no backend contract change and no new `audio_b64` traffic from this screen.
- Restructure the Asistente screen's layout so the animated orb, greeting, mic button, and text-input pill are fixed (never scroll off-screen); only the turn/message history below them scrolls internally when it overflows the available space. Today all of it (orb, greeting, mic, input, and every turn) lives inside one `FlatList`'s header + items, so a long conversation scrolls the orb away with everything else.
- The AI's reply side of the chat is unaffected by this change — agent turns still render however `sendMessage`'s response resolves (existing A2UI surface rendering), there's no new placeholder needed for it.

## Capabilities

### New Capabilities
- `mobile/assistant`: chat transcript and layout requirements for the Soporte IA screen (transcribed voice input rendered as a real chat bubble; fixed orb/header vs. scrollable message area). This capability's directory doesn't exist yet under `openspec/specs/` because its originating change, `add-assistant-orb-screen`, hasn't been archived yet — this change adds further requirements to the same eventual capability alongside it (see Impact).

### Modified Capabilities
- `mobile/voice`: replaces the "record with expo-audio, upload as `audio_b64`" requirement with on-device speech recognition that submits recognized text through the existing text-message path.

## Impact

- **Affected code**: `hackmtyfront/src/features/voice/useVoiceRecorder.ts` (replaced by a speech-recognition hook), `hackmtyfront/app/(tabs)/asistente.tsx` (`handleMicPress`, `submitAudio`, the FlatList/header layout, the `"🎤 Mensaje de voz"` literal), `hackmtyfront/app.config.ts` (new plugin entry + permission strings).
- **New dependency**: `expo-speech-recognition` (community package), added to `package.json` and `app.config.ts`'s `plugins`.
- **Native build**: requires `expo prebuild`/a new dev-client build (`eas build --profile development`) before this can run on-device — it will not work under `expo start` + Expo Go.
- **API contract**: unchanged (`MessageRequest`'s `audio_b64` variant stays in `src/api/types.ts`/`endpoints.ts` for any other caller; this screen simply stops using it).
- **Depends on**: the not-yet-archived `add-assistant-orb-screen` change, which owns the idle/active screen structure this change reshapes. If that change's approach to the idle/active layout changes before archiving, this change's `mobile/assistant` delta and `design.md` should be revisited together with it.
- **Out of scope**: the assistant's (agent) reply bubble/content — still driven entirely by whatever `sendMessage`'s response contains today; no placeholder or mock reply is introduced by this change.
