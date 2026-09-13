## Context

See `proposal.md` for motivation. Current state relevant to this design:

- `app/(tabs)/asistente.tsx` owns the assistant screen. Its layout is governed by `replace-assistant-chat-with-fullscreen-generative-ui`: an idle greeting screen and, once the agent responds, a single full-panel generated A2UI surface with a floating orb. This change does not alter that layout.
- `src/features/voice/useVoiceRecorder.ts` wraps `expo-audio`: `start()` requests mic permission once, records; `stop()` returns a base64 string or `null`.
- The screen's text path already does the "send `sendMessage({ session_id, text })` → apply the response" flow the voice path should reuse.
- `RecordingPulse` is a presentational pulse driven by an `active` boolean; it doesn't know or care what produces that boolean.
- Expo SDK 57, dev client already configured (`eas.json`'s `development` profile has `developmentClient: true`); no `ios.infoPlist` custom usage strings exist yet in `app.config.ts` — `expo-audio`'s own plugin injects its own mic string today.

## Goals / Non-Goals

**Goals:**
- Swap the mic button's backing mechanism from expo-audio record+upload to on-device `expo-speech-recognition`, without changing the button's outward interaction model (press to start, press to stop).
- Submit the recognized text through the same text-message path typed input uses.

**Non-Goals:**
- Screen layout and transcript display — owned by `replace-assistant-chat-with-fullscreen-generative-ui`. In particular, this change renders no user-text chat bubble.
- No changes to the `/api/message` contract or `MessageRequest` type — the voice path just stops choosing the `audio_b64` union member.
- No streaming of partial transcript text to the backend mid-utterance — only the finalized transcript is sent, once, on stop.
- Not attempting to keep Expo Go compatibility — the proposal already accepts the dev-client-only trade-off.

## Decisions

**1. Library: `expo-speech-recognition` (jamsch) over `@react-native-voice/voice`.**
Actively maintained for current Expo SDKs, ships a config plugin (so permission strings/entitlements are declarative in `app.config.ts` rather than requiring manual native project edits), and exposes an event-based API (`start`, `stop`, `addSpeechRecognitionListener('result', ...)`) that maps cleanly onto a small hook with the same shape as the existing `useVoiceRecorder`. `@react-native-voice/voice` is a viable fallback if the chosen package proves unstable during implementation, but isn't the first choice given weaker recent-SDK maintenance.

**2. Replace `useVoiceRecorder` with a new `useSpeechToText` hook (same call-site shape, different return value).**
New hook returns `{ state, isListening, partialText, start(), stop(): Promise<string | null> }` — mirrors the old `{ state, isRecording, start, stop }` shape closely enough that the screen's mic handlers barely change (`stop()` now resolves to recognized text instead of base64), and `RecordingPulse` keeps taking a plain boolean (`isListening` instead of `isRecording`). `useVoiceRecorder.ts`/`expo-audio` recording is deleted from this call site; `expo-audio` itself stays (TTS playback in `audioCache.ts` is untouched).
Alternative considered: keep `useVoiceRecorder` recording audio in parallel with recognition (e.g., for a future "replay what you said" feature). Rejected — no current requirement needs it, and it would keep the mic-permission-for-recording code path alive for no reason (YAGNI).

**3. Voice submission reuses the text path, not a parallel audio path.**
On stop, if the transcript is non-empty, submit it through the same function typed input uses (`submitText(transcript)`). The old `submitAudio` and its `sendMessage({ audio_b64 })` call are deleted from this screen. No user-text bubble is rendered (see `replace-assistant-chat-with-fullscreen-generative-ui`); the transcript's only effect is the turn it sends.

**4. Permission/config: add `expo-speech-recognition` to `app.config.ts`'s `plugins`, with explicit `microphonePermission`/`speechRecognitionPermission` strings (iOS) since none exist in this file today** (unlike `expo-audio`, which supplies its own default string). Android's `RECORD_AUDIO` permission is added by the library's plugin automatically.

## Risks / Trade-offs

- **[Risk] On-device recognition accuracy for Spanish may be lower than a cloud STT (e.g., Whisper) the backend might otherwise use, especially with noise/accents.** → Mitigation: the text input and typed-message path remain fully available as a fallback; users can correct/retype. Not addressed further in this change (no in-place edit-before-send UI is introduced — out of scope; flag for a follow-up if accuracy turns out to be a real problem).
- **[Risk] `expo-speech-recognition` requires a native rebuild; anyone testing via `expo start` + Expo Go will see it silently fail to link.** → Mitigation: call this out explicitly in `tasks.md` (rebuild dev client step) and in the PR description; this is a one-time cost given the dev client profile already exists.
- **[Risk] Android's on-device recognizer availability varies by device/OEM (some require the Google app to be present/updated).** → Mitigation: the hook checks module/recognition availability and surfaces an unavailable state rather than crashing or hanging.
- **[Trade-off] Deleting the `audio_b64` call site here means this screen has no voice path if speech recognition is ever unavailable on a device, other than typing.** Acceptable per proposal — falling back to a second (audio-upload) voice path was never requested and would double the surface area for a hackathon-scoped change.

## Migration Plan

1. Add the dependency and config plugin; run `expo prebuild` (or let the next `eas build --profile development` do it) and produce a new dev client build — required before any of this is testable on-device.
2. Build the new hook and swap the mic button's handlers behind it; delete `useVoiceRecorder.ts` and the old audio-upload path once the new path is verified working, in the same change (no staged rollout to real users, just a build that needs a fresh dev client install).
3. No rollback concern beyond reverting the commit/dev-client build — there's no server-side or persisted-data migration involved.

## Open Questions

- Exact `expo-speech-recognition` config-plugin option names/permission-string copy — resolved during implementation by reading the library's current README rather than guessing here; doesn't change the spec, approach, or task breakdown.
