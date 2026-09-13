## Context

`src/api/client.ts` read `Constants.expoConfig.extra.apiBaseUrl` and concatenated
it with an `/api/...` path; `src/api/endpoints.ts` separately trimmed a trailing
slash, and `app/(tabs)/asistente.tsx` read `Constants` directly. The
`EXPO_PUBLIC_API_BASE_URL` value is a tunnel origin that may or may not end in `/`,
so the two code paths disagreed and `apiRequest` produced `host//api/...`.

Separately, the greeting `useFocusEffect` set `greetedForSessionRef` before the
request and used a `cancelled` flag cleared by any dependency change (including
`turns.length` and `catalogId`), so an in-flight greeting could be discarded
permanently for that session. The `turnInFlight` lock is a plain boolean with no
timeout, and the mic handler skipped `stop()` while a turn was in flight.

## Goals / Non-Goals

**Goals:**
- Exactly one backend-origin construction point; no `//` regardless of a trailing
  slash in config.
- The welcome greeting plays once per session, reliably, and retries on failure.
- A wedged turn can never permanently disable the assistant; the user is told
  when a send is ignored.
- Recording always yields either a send or a clear "no te escuché" message.
- Audio plays for every audience.

**Non-Goals:**
- Changing the A2UI wire contract or the accessible catalog selection.
- Queueing turns (we chose feedback + watchdog over queueing).
- TTS on the per-loan/liability detail pages.

## Decisions

**1. One `getApiBaseUrl()` that strips all trailing slashes.** `client.ts` and
`endpoints.ts` import it; `app.config.ts` strips at build time too. The build value
is a tunnel origin with or without a slash, so trimming is the only safe contract.

**2. Greeting marks the session greeted on success only, and is not cancelled.**
The effect only *triggers* `greetIfNeeded(sessionId)`; the async work runs to
completion and sets `greetedForSessionRef` after a successful greeting (or
successful fallback). A failed attempt leaves the ref unset so the next focus
retries. This removes the "cancelled but marked greeted" trap.

**3. Watchdog + feedback instead of queueing.** `beginTurn` records
`turnStartedAt`; a 30 s timer force-releases a wedged lock (the client request
timeout is 15 s, loans 12 s, so anything older is wedged). Sends/mic while a turn
is in flight append a short system bubble.

**4. Mic capture is independent of the turn lock.** `handleMicPressOut` always
calls `speech.stop()`; only the subsequent send is gated. An empty transcript or
an unsupported build gives explicit feedback.

**5. Audio for all.** Frontend plays whenever `audio_ref` is present. Backend:
`AgentService.greeting` always synthesizes; `SpeechEnricher.enrich` no longer
requires `accessible` and uses the surface's `speech` when present, else the
assistant reply text (`fallback_text`). Detail domains never call the enricher.

## Risks / Trade-offs

- **[Risk]** Always synthesizing adds a TTS step to every reply (latency). → TTS is
  fast and failure degrades to no audio; under `PR_SWITCH` it uses local Piper.
- **[Risk]** Trimming the base URL could mask a genuinely different origin. → The
  origin is opaque; only trailing slashes are removed.
- **[Risk]** A 30 s watchdog could cut a legitimately slow turn. → It is longer than
  every client timeout, so it only fires on a wedged lock.
