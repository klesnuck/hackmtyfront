## Why

The Soporte IA screen let the user start a new turn while a previous one was
still pending, so the backend received overlapping requests for one
conversation and interleaved its replies. Four client-side gaps:

1. The busy guard was a React state boolean (`isSending`) read from a stale
   render closure — two calls in the same tick both saw `false`.
2. The mic control was never disabled while a send was in flight, so the user
   could record and submit a second turn mid-response.
3. The send control stayed enabled while the mic was recording (only the
   `TextInput` was non-editable), so a retained `draft` could be submitted while
   the transcript was still being captured.
4. The A2UI action path (`POST /api/action`) and the loan confirmation had no
   shared guard at all.

This is a frontend coordination bug, not a backend one: the contract is
one request at a time per conversation, and the UI is responsible for
enforcing it.

## What Changes

- Add a **synchronous turn lock** in the ephemeral UI store (`beginTurn` /
  `endTurn`, `turnInFlight`) that every server-bound turn acquires.
- Route **all** server-bound turns through it: `/api/message`, `/api/loans/greeting`
  and `/api/loans/consult`, `/api/agent/greeting`, `/api/action`, and
  `POST /api/loans` (loan confirmation).
- Disable the mic while a turn is in flight and disable send/input for the whole
  recording lifecycle (requesting permission, listening, processing).
- Release the lock as soon as the response is received (not after TTS playback),
  including on handled errors and timeouts, so the UI never sticks.
- Add defensive synchronous re-entrancy guards inside `useSpeechToText`
  (`start`/`stop`) and `useLoanConsult` (`greet`/`send`).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `mobile/assistant`: accepts one in-flight turn at a time; recording and sending
  are mutually exclusive; the lock is always released.
- `mobile/a2ui-engine`: a surface action is not dispatched while a turn is in
  flight, so component presses cannot race a message.

> `mobile/assistant` is introduced by the still-pending `add-assistant-orb-screen`
> and `add-assistant-initial-greeting`. This change's delta uses `ADDED` and should
> be applied/archived together with (or after) those two.

## Impact

- Changed files: `src/state/ui.store.ts`, `app/(tabs)/asistente.tsx`,
  `src/a2ui/actionBus.ts`, `src/features/voice/useSpeechToText.ts`,
  `src/features/loans/useLoanConsult.ts`.
- No backend change; no new dependency.
- No invariant change: `INV-010` (HTTP-only) is preserved — this serializes
  existing HTTP calls, it does not add a transport.
- Trade-off: a component action pressed while a turn is in flight is ignored
  (no queued request, no error surface). Acceptable because the surface stays
  visible and the user can press again once the turn completes.
- Verification: `npm run typecheck` clean; `npm run lint` (blocked in this
  environment by a pre-existing `unrs-resolver` native-binding failure); manual
  double-fire checks against the backend.
