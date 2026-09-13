## Why

On iOS, the assistant's spoken replies never played, even though the backend
produced and served them correctly (`GET /api/audio/aud_…` returned `200` with
`Content-Type: audio/mpeg`). Two client-side causes:

1. **Wrong container extension.** `src/features/voice/audioCache.ts` downloaded
   the MP3 bytes to a file named `…m4a`. iOS's `AVPlayer` chooses its demuxer from
   the file extension, so a `.m4a` file containing MP3 data fails to load.
2. **No playback audio session.** Nothing in the app called
   `setAudioModeAsync({ playsInSilentMode: true })`. iOS respects the silent/ringer
   switch by default, and on-device speech recognition can leave the session in a
   recording category, muting the assistant's reply.

The failure was invisible because every call site did `void playAudioAsset(...)`,
so a rejected download/load/play was silently discarded.

## What Changes

- Cache backend TTS assets under their real media format (`.mp3`), keyed by
  `asset_id`, so iOS can decode them.
- Configure a media playback audio session at app startup (`playsInSilentMode`),
  and re-assert it after on-device speech recognition ends.
- Surface playback failures in development instead of discarding them.
- Resolve a relative `AudioPlayer` node `url` against the backend origin.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `mobile/voice`: how TTS assets are cached (correct format) and played (audio
  session), and that playback failures are observable.

## Impact

- Changed files: `src/features/voice/audioCache.ts`, `app/_layout.tsx`,
  `src/features/voice/useSpeechToText.ts`, `src/catalog/standard/AudioPlayer.tsx`,
  `src/api/endpoints.ts`.
- No backend change, no new dependency, no invariant change (`INV-010` untouched —
  this is playback of already-fetched audio, not a transport change).
- Verification: iOS with the silent switch on and off, immediately after a spoken
  turn, for loans audio and accessible auto-play.
