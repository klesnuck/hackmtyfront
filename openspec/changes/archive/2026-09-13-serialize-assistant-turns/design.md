## Context

The assistant screen issues server-bound turns from several places: the mic
transcript (`submitText`), the text input, the initial intent, the focus greeting
(and its `/api/message` fallback), the A2UI action bus, and the loan confirmation.
All of them mutate the same conversation, so they must be serialized. The only
guard was a React state boolean, which is read from a render-time closure and
therefore does not prevent two calls in the same tick. `app/(tabs)/asistente.tsx`,
`src/a2ui/actionBus.ts`, `src/features/voice/useSpeechToText.ts`,
`src/features/loans/useLoanConsult.ts`.

## Goals / Non-Goals

**Goals:**
- One server-bound turn per conversation at a time, enforced on the client.
- The user cannot record or send while a turn is pending; the controls say so.
- The lock is released on success, handled error, and timeout.

**Non-Goals:**
- Any backend change or request deduplication (the backend is a separate
  repository and this is a client coordination bug).
- Blocking input until TTS playback finishes (playback is fire-and-forget).
- A request queue or optimistic multi-turn batching.
- A transport change (`INV-010` stays HTTP-only).

## Decisions

**1. A synchronous mutex in `useUiStore`, not a local `useRef` or `isSending`.**
Zustand's `get()`/`set()` are synchronous, so `beginTurn()` is an atomic
check-and-set that a React state boolean cannot provide. A component-local ref
would fix the screen but not `actionBus`, which lives outside the component tree,
so the lock has to be shared. Alternatives considered: (a) keep `isSending` and
add a ref — fixes the same-tick race but not the cross-module action bus; (b)
rely on `AbortController` — cancels the first request but the second still goes
out, so the backend still sees both.

**2. Every server-bound path shares the lock.** `/api/message`,
`/api/loans/greeting`, `/api/loans/consult`, `/api/agent/greeting`, `/api/action`,
and `POST /api/loans`. The initial-intent and focus-greeting effects acquire the
lock before they mark themselves consumed, so a user turn and a greeting can never
overlap; if the lock is already held the greeting is left un-marked and can retry
on a later focus.

**3. Recording and sending are mutually exclusive.** The mic is disabled while a
turn is in flight, and the send control is disabled for the whole recording
lifecycle (`requesting-permission`, `listening`, `processing`) — previously only
the `TextInput` was disabled while listening, leaving the send button able to
submit a retained draft.

**4. Release on response, not on playback.** The requirement is "until the last
response is received". TTS keeps playing in the background; the user can start the
next turn immediately. Holding the lock through playback would require exposing a
playback-completion signal and would make the assistant feel blocked.

**5. When busy, a surface action is ignored, not queued.** The A2UI action path
claims the lock and, if it is held, returns without sending. This keeps the
"one path to the network" rule intact and avoids a queue; the surface remains
visible and the user can press again after the turn completes. Alternative
(disable the whole surface) was rejected as it would require threading the busy
flag through the renderer.

**6. Defensive guards at the leaf hooks.** `useSpeechToText` (`start`/`stop`) and
`useLoanConsult` (`greet`/`send`) get synchronous re-entrancy refs so even a
direct caller cannot overlap them; the screen's lock is the primary guard.

## Risks / Trade-offs

- **[Risk]** The lock lives in a global store, so a turn in one screen would block
  another; currently only the Soporte IA screen issues turns, so this is the
  desired behavior. → Revisit if a second conversation surface appears.
- **[Risk]** A dropped (ignored) action could look like a dead button. → The
  surface stays rendered; the next press after the response works. Acceptable
  versus an overlapping-request race.
- **[Risk]** An unhandled throw between `beginTurn()` and the `try` could strand
  the lock. → Every acquisition is immediately followed by `try { … } finally {
  endTurn(); }`.
