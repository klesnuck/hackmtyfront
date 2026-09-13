## 1. Turn lock

- [ ] 1.1 `src/state/ui.store.ts`: add `turnInFlight`, `beginTurn()` (sync check-and-set via `get`/`set`), `endTurn()`.
- [ ] 1.2 `app/(tabs)/asistente.tsx`: replace local `isSending` state with the store subscription; derive `isRecording`/`inputBlocked`.

## 2. Gate every server-bound turn

- [ ] 2.1 `app/(tabs)/asistente.tsx`: `submitText` acquires the lock (`if (!text.trim() || !beginTurn()) return`) and releases it in `finally`.
- [ ] 2.2 `app/(tabs)/asistente.tsx`: the `prestamo-nuevo` intent acquires the lock before `loanConsult.greet`, releases in `finally`.
- [ ] 2.3 `app/(tabs)/asistente.tsx`: the focus-greeting effect acquires the lock before marking the session greeted and releases in `finally` (including the `/api/message` fallback).
- [ ] 2.4 `app/(tabs)/asistente.tsx`: `handleConfirmLoan` acquires/releases the shared lock.
- [ ] 2.5 `src/a2ui/actionBus.ts`: claim the lock before `sendAction`; skip the dispatch when a turn is in flight; release in `finally`; leave the client-routed `request_loan` branch lock-free.

## 3. Mutually exclusive mic / send

- [ ] 3.1 `app/(tabs)/asistente.tsx`: mic button disabled while `isSending`; `handleMicPressIn`/`handleMicPressOut` early-return while `isSending`.
- [ ] 3.2 `app/(tabs)/asistente.tsx`: `TextInput` editable only when `!inputBlocked`; send disabled for the full recording lifecycle; `handleIdleSendText` early-returns while blocked.
- [ ] 3.3 `app/(tabs)/asistente.tsx`: show the `ActivityIndicator` in the send control while a turn is in flight.

## 4. Defensive leaf guards

- [ ] 4.1 `src/features/voice/useSpeechToText.ts`: `startingRef`/`stoppingRef` so `start`/`stop` cannot re-enter.
- [ ] 4.2 `src/features/loans/useLoanConsult.ts`: `inFlightRef` in `greet`/`send` (release in `finally`).

## 5. Verification

- [ ] 5.1 `npm run typecheck` clean.
- [ ] 5.2 `npm run lint` clean (currently blocked in this environment by a pre-existing `unrs-resolver` native-binding failure, unrelated to this change).
- [ ] 5.3 Manual: double-tap send and return-key + tap → one backend request per turn.
- [ ] 5.4 Manual: press the mic while a turn is pending → recording does not start; tap send while recording → no send.
- [ ] 5.5 Manual: press a surface action while a turn is pending → no `/api/action` request.
- [ ] 5.6 Manual: inject a timeout/error → controls re-enable and the next turn works.
- [ ] 5.7 `npx -y @fission-ai/openspec validate serialize-assistant-turns` (CLI not installed locally).
