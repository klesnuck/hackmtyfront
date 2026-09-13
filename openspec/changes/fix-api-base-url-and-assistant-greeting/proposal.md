## Why

Two user-visible defects, both traced to the frontend:

1. **Every `apiRequest` URL gets a double slash (`//api/...`) and 404s.** The
   configured backend origin (`EXPO_PUBLIC_API_BASE_URL`, baked into
   `extra.apiBaseUrl`) can end in `/`, and `src/api/client.ts` concatenated it
   verbatim with an `/api/...` path. Only `endpoints.ts` trimmed the slash, so the
   loans/audio flows worked while the general assistant (`/api/message`,
   `/api/agent/greeting`, profile, accounts, actions, payments) silently failed at
   the edge — the backend never even logged those requests.

2. **The Asistente greeting is unreliable and sends/mic can silently do nothing.**
   The greeting effect marked the session "greeted" *before* the request and
   cancelled itself on any dependency change/blur, so a cancelled greeting never
   retried; the global `turnInFlight` lock had no watchdog and ignored new sends
   with no feedback; and releasing the mic early-returned while a turn was in
   flight, leaving recognition running and discarding the transcript.

## What Changes

- **One normalized backend origin.** New `src/api/baseUrl.ts::getApiBaseUrl()`
  (strips all trailing slashes); `client.ts`, `endpoints.ts`, and the Asistente
  screen all use it; `app.config.ts` also strips when baking the build value.
- **Greeting is retryable.** Marks the session greeted only on success, is not
  cancelled by re-renders/blur, and surfaces a real error instead of a silent no-op.
- **Turn-lock watchdog + feedback.** `turnInFlight` gains a start timestamp and a
  30 s watchdog that releases a wedged lock; ignored sends/mic presses show a
  "terminando la respuesta anterior" message instead of doing nothing.
- **Mic reliability.** Releasing the mic always ends recognition (even during a
  background turn); an empty transcript says "no te escuché"; a build without the
  native STT module says dictation is unavailable.
- **Audio for all users.** The frontend plays `audio_ref` whenever present (no
  more `voz-color` gate); the backend greeting and `/api/message` turn now always
  synthesize — accessible/simple users speak the simplified `speech` summary,
  everyone else speaks the assistant's reply text. Per-credit detail pages stay
  TTS-free.

## Capabilities

### New Capabilities
- `mobile/api-client`: the normalized backend origin and its single construction point.

### Modified Capabilities
- `mobile/assistant` (ADDED): reliable, retryable greeting; audio for all; turn-lock
  feedback/watchdog; mic capture that always ends recognition.

## Impact

- Frontend: `src/api/{baseUrl,client,endpoints}.ts`, `app.config.ts`, `eas.json`,
  `app/(tabs)/asistente.tsx`, `src/state/ui.store.ts`,
  `src/features/voice/useSpeechToText.ts`.
- Backend: `agent/service.py` (greeting + run_turn), `agent/speech.py`.
- No A2UI wire/contract change.
- Verification: backend suite green; `npm run typecheck`; `openspec validate`.
