## 1. Cache format

- [ ] 1.1 `src/features/voice/audioCache.ts`: cache the downloaded TTS asset as `…mp3` (backend serves `audio/mpeg`), keyed by `asset_id`.

## 2. Playback audio session

- [ ] 2.1 `app/_layout.tsx`: on mount, `setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false, shouldRouteThroughEarpiece: false, interruptionMode: 'doNotMix' })`.
- [ ] 2.2 `src/features/voice/useSpeechToText.ts`: on recognition end, release the recognizer's iOS session (`setAudioSessionActiveIOS(false)` + `setCategoryIOS(playback/default)`) and re-assert the playback mode.
- [ ] 2.3 `src/features/voice/useSpeechToText.ts`: on start, pass `iosCategory` `{ playAndRecord, defaultToSpeaker, default }` so recognition doesn't leave a voice-processing mode.
- [ ] 2.4 `src/features/voice/audioCache.ts`: assert the playback mode before playing (defensive), create the player with `keepAudioSessionActive: true`, set `volume = 1`, and release it when playback finishes.

## 3. Observability

- [ ] 3.1 `src/features/voice/audioCache.ts`: catch download/load/play errors and `console.warn` them in development.

## 4. URL resolution

- [ ] 4.1 `src/api/endpoints.ts`: export `getApiBaseUrl` / `resolveApiUrl`.
- [ ] 4.2 `src/catalog/standard/AudioPlayer.tsx`: resolve a relative `node.url` against the origin.

## 5. Verification

- [ ] 5.1 iOS, silent switch on and off: loans greeting/consult audio plays.
- [ ] 5.2 iOS: accessible (`voz-color`) auto-play plays.
- [ ] 5.3 iOS: TTS still plays on the turn immediately after using the mic.
- [ ] 5.4 Dev logs show no `[audio] playAudioAsset failed` warning; cache file is `a2ui-audio-aud_….mp3`.
- [ ] 5.5 `npm run typecheck` and `npm run lint` clean.
