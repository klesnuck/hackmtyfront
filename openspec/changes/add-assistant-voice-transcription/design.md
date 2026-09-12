## Context

See `proposal.md` for motivation. Current state relevant to this design:

- `app/(tabs)/asistente.tsx` owns everything: turn state (`turns: Turn[]`), the idle→active flag, and a single `FlatList` whose `ListHeaderComponent` renders the orb, greeting, big mic button, and idle text-input pill above the turn items — so that whole block scrolls with the list.
- `src/features/voice/useVoiceRecorder.ts` wraps `expo-audio`: `start()` requests mic permission once, records; `stop()` returns a base64 string or `null`.
- `handleMicPress` (asistente.tsx:128-139) calls `recorder.stop()` and, if it returns audio, calls `submitAudio(audioB64)` (asistente.tsx:107-126), which appends a hardcoded `'🎤 Mensaje de voz'` user turn and posts `sendMessage({ session_id, audio_b64 })`.
- `submitText` (asistente.tsx:83-105) already does the "append user turn → `sendMessage({ session_id, text })` → apply response" flow we want the voice path to reuse.
- `RecordingPulse` (src/features/voice/RecordingPulse.tsx) is a presentational pulse driven by an `active` boolean; it doesn't know or care what produces that boolean.
- Expo SDK 57, dev client already configured (`eas.json`'s `development` profile has `developmentClient: true`); no `ios.infoPlist` custom usage strings exist yet in `app.config.ts` — `expo-audio`'s own plugin injects its own mic string today.

## Goals / Non-Goals

**Goals:**
- Swap the mic button's backing mechanism from expo-audio record+upload to on-device `expo-speech-recognition`, without changing the button's outward interaction model (press to start, press to stop).
- Make the recognized text visible in the chat exactly like a typed message would be.
- Split the screen's single scrolling `FlatList` into a fixed section (top bar, orb, greeting, mic, input pill) and an independently scrolling turn list beneath it.

**Non-Goals:**
- No changes to the agent/reply side of the conversation (A2UI rendering, TTS playback) — out of scope per proposal.
- No changes to the `/api/message` contract or `MessageRequest` type — the voice path just stops choosing the `audio_b64` union member.
- No streaming of partial transcript text to the backend mid-utterance — only the finalized transcript is sent, once, on stop.
- Not attempting to keep Expo Go compatibility — the proposal already accepts the dev-client-only trade-off.

## Decisions

**1. Library: `expo-speech-recognition` (jamsch) over `@react-native-voice/voice`.**
Actively maintained for current Expo SDKs, ships a config plugin (so permission strings/entitlements are declarative in `app.config.ts` rather than requiring manual native project edits), and exposes an event-based API (`start`, `stop`, `addSpeechRecognitionListener('result', ...)`) that maps cleanly onto a small hook with the same shape as the existing `useVoiceRecorder`. `@react-native-voice/voice` is a viable fallback if the chosen package proves unstable during implementation, but isn't the first choice given weaker recent-SDK maintenance.

**2. Replace `useVoiceRecorder` with a new `useSpeechToText` hook (same call-site shape, different return value).**
New hook returns `{ state, isListening, partialText, start(), stop(): Promise<string | null> }` — mirrors the old `{ state, isRecording, start, stop }` shape closely enough that `asistente.tsx`'s `handleMicPress` barely changes (`recorder.stop()` now resolves to recognized text instead of base64), and `RecordingPulse` keeps taking a plain boolean (`isListening` instead of `isRecording`). `useVoiceRecorder.ts`/`expo-audio` recording is deleted from this call site; `expo-audio` itself stays (TTS playback in `audioCache.ts` is untouched).
Alternative considered: keep `useVoiceRecorder` recording audio in parallel with recognition (e.g., for a future "replay what you said" feature). Rejected — no current requirement needs it, and it would keep the mic-permission-for-recording code path alive for no reason (YAGNI).

**3. Voice submission reuses `submitText`, not a parallel `submitAudio`.**
On stop, if the transcript is non-empty, call the existing `submitText(transcript)` directly instead of maintaining a second near-duplicate function. `submitAudio` and its `sendMessage({ audio_b64 })` call are deleted from this screen. This is what makes the "shows in chat as a real message" requirement nearly free — it's the exact same code path a typed message already takes.

**4. Layout split: lift the fixed header out of `ListHeaderComponent` into a sibling `View` above the list.**
Current tree: `SafeAreaView > idleTopBar (fixed) + KeyboardAvoidingView > FlatList (header=orb/greeting/mic/input, items=turns)`.
New tree: `SafeAreaView > idleTopBar (fixed) + fixedHeaderSection (orb/greeting/mic/input, NOT inside the list) + KeyboardAvoidingView(flex:1) > FlatList (items=turns only, no ListHeaderComponent)`.
The turns `FlatList` gets `style={{ flex: 1 }}` so it fills the remaining space below the fixed section and clips its own content; `scrollToEnd` on new turns keeps working unchanged since it's still the same `FlatList`, just without the header content inline. This directly satisfies the "orb/greeting/mic/input never scroll away, only history scrolls" requirement without introducing a second nested scroll container (which would risk the classic RN "scroll view inside scroll view" gesture conflicts).
Alternative considered: wrap everything in an outer `ScrollView` with a `nestedScrollEnabled` inner `FlatList`. Rejected — two nested scrollables fighting over vertical pan gestures is a well-known RN footgun and unnecessary here since the fixed part truly never needs to scroll.

**5. Idle vs. active layout stays keyed off the existing `isActive` flag.**
When `!isActive` (no turns, no manual/intent activation), the fixed section alone effectively fills the screen exactly as it does today (empty `FlatList` renders nothing below it) — no separate "idle screen" component is introduced, keeping this change additive to the existing state machine from `add-assistant-orb-screen` rather than replacing it.

**6. Permission/config: add `expo-speech-recognition` to `app.config.ts`'s `plugins`, with explicit `microphonePermission`/`speechRecognitionPermission` strings (iOS) since none exist in this file today** (unlike `expo-audio`, which supplies its own default string). Android's `RECORD_AUDIO` permission is added by the library's plugin automatically.

## Risks / Trade-offs

- **[Risk] On-device recognition accuracy for Spanish may be lower than a cloud STT (e.g., Whisper) the backend might otherwise use, especially with noise/accents.** → Mitigation: the text input and typed-message path remain fully available as a fallback; users can correct/retype. Not addressed further in this change (no in-place edit-before-send UI is introduced — out of scope; flag for a follow-up if accuracy turns out to be a real problem).
- **[Risk] `expo-speech-recognition` requires a native rebuild; anyone testing via `expo start` + Expo Go will see it silently fail to link.** → Mitigation: call this out explicitly in `tasks.md` (rebuild dev client step) and in the PR description; this is a one-time cost given the dev client profile already exists.
- **[Risk] Android's on-device recognizer availability varies by device/OEM (some require the Google app to be present/updated).** → Mitigation: `expo-speech-recognition` exposes `ExpoSpeechRecognitionModule.getSpeechRecognitionServices()`/an availability check; wire the same "mic unavailable" system-turn message used for permission denial when recognition isn't available, rather than crashing or hanging.
- **[Trade-off] Deleting `submitAudio`/the `audio_b64` call site here means this screen has no voice path if speech recognition is ever unavailable on a device, other than typing.** Acceptable per proposal — falling back to a second (audio-upload) voice path was never requested and would double the surface area for a hackathon-scoped change.

## Migration Plan

1. Add the dependency and config plugin; run `expo prebuild` (or let the next `eas build --profile development` do it) and produce a new dev client build — required before any of this is testable on-device.
2. Build the new hook and swap the mic button's handlers behind it; delete `useVoiceRecorder.ts` and `submitAudio` once the new path is verified working, in the same change (no need to keep both around — this isn't a staged rollout to real users, just a build that needs a fresh dev client install).
3. Land the layout split in the same change; verify both on a short conversation (nothing scrolls) and a long one (only history scrolls, orb/mic/input stay put).
4. No rollback concern beyond reverting the commit/dev-client build — there's no server-side or persisted-data migration involved.

## Open Questions

- Exact `expo-speech-recognition` config-plugin option names/permission-string copy — resolved during implementation by reading the library's current README rather than guessing here; doesn't change the spec, approach, or task breakdown.
