## Context

The backend's `voice` MCP caches TTS as `audio_cache/aud_*.mp3` and serves
`audio/mpeg` (`mcp_servers/voice/service.py`); Piper (under `PR_SWITCH`) also
emits real MP3 via `lameenc`. The client's `playAudioAsset` downloaded those bytes
and handed a local file URI to `expo-audio`. On iOS the extension-driven demuxer
rejected the `.m4a` filename, and no playback audio session was configured. See
`proposal.md` for the evidence.

## Goals / Non-Goals

**Goals:**
- iOS TTS playback works with the silent switch on and immediately after a spoken
  turn.
- The cached file's format matches the bytes.
- Playback failures are observable in development.

**Non-Goals:**
- Changing how the backend produces or serves audio.
- Switching away from the legacy `expo-file-system` download path (kept as a
  documented fallback refactor).
- Streaming/partial playback or transport changes (`INV-010` unchanged).

## Decisions

**1. Cache with the asset's real format (`.mp3`).** The backend always serves
`audio/mpeg`; naming the cache file `.mp3` matches it. Alternatives considered:
extensionless names (iOS sniffing is unreliable for local files) and deriving the
extension from `Content-Type` (the legacy `downloadAsync` result doesn't expose it
cleanly). Renaming also invalidates any previously cached broken `.m4a` files.

**2. Configure the audio session at the app boundary, and after STT.** Call
`setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })` once in
`app/_layout.tsx`, re-assert it in `useSpeechToText`'s end handler (speech
recognition switches `AVAudioSession` to a record category), and defensively again
inside `playAudioAsset` before playback. Redundant but cheap and covers every path.

**3. Playback stays non-blocking, but observable.** `playAudioAsset` keeps its
fire-and-forget signature; it now catches and `console.warn`s in development so a
future failure is diagnosable instead of silent.

**4. Resolve relative `AudioPlayer` URLs at the boundary.** A catalog `AudioPlayer`
node may receive a relative `/api/audio/...` ref; resolve it via `resolveApiUrl`
so the component and auto-play share one URL rule.

**5. Documented fallback (not implemented).** If the `.mp3` + session fix is
insufficient, the next step is a provider-based `useAudioPlayer(...)`
`replace(url).play()` manager that drops `expo-file-system/legacy` and retains the
player across renders. Out of scope for this minimal fix.

## Risks / Trade-offs

- **[Risk]** `setAudioModeAsync` is called per playback, adding a small await
  before audio starts. → Negligible for short TTS clips; it also guarantees the
  session is correct after any recording.
- **[Risk]** A future backend could serve a non-MP3 format. → The cache extension
  would need to follow the `audio_ref`/content type; noted as a follow-up.
