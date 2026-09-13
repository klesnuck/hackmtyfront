## 1. URL normalization

- [x] 1.1 Add `src/api/baseUrl.ts::getApiBaseUrl()` (strips all trailing slashes)
- [x] 1.2 `client.ts` and `endpoints.ts` use it (remove the duplicate/unnormalized paths)
- [x] 1.3 `app.config.ts` strips trailing slashes; `eas.json` dev value cleaned
- [x] 1.4 `app/(tabs)/asistente.tsx` uses the shared helper

## 2. Greeting lifecycle

- [x] 2.1 Greeting marks the session greeted only on success; retries on failure
- [x] 2.2 Greeting is not cancelled by re-renders/blur

## 3. Turn lock + feedback

- [x] 3.1 `turnInFlight` gains `turnStartedAt` + a 30 s watchdog (`resetTurn`)
- [x] 3.2 Ignored sends/mic presses show a "terminando la respuesta anterior" message

## 4. Mic capture

- [x] 4.1 Release always calls `speech.stop()` (even during a background turn)
- [x] 4.2 Empty transcript and unsupported-build feedback

## 5. Audio for all users

- [x] 5.1 Frontend plays `audio_ref` whenever present (no `voz-color` gate)
- [x] 5.2 Backend greeting always synthesizes
- [x] 5.3 `SpeechEnricher` speaks `speech` or the assistant reply text for every turn
- [x] 5.4 Detail domains stay TTS-free

## 6. Verification

- [x] 6.1 Backend suite green (257)
- [x] 6.2 `npm run typecheck` clean
- [ ] 6.3 `openspec validate` clean
- [ ] 6.4 Manual: no `//`; greeting once for every persona; blur/refocus keeps it; busy send shows feedback; mic always ends; audio plays for standard users
