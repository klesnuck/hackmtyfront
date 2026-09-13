## 1. Turn lock

- [x] 1.1 `src/state/ui.store.ts`: add `turnInFlight`, `beginTurn()` (sync check-and-set via `get`/`set`), `endTurn()`.
- [x] 1.2 `app/(tabs)/asistente.tsx`: replace local `isSending` state with the store subscription; derive `isRecording`/`inputBlocked`.

## 2. Gate every server-bound turn

- [x] 2.1 `app/(tabs)/asistente.tsx`: `submitText` acquires the lock (`if (!text.trim() || !beginTurn()) return`) and releases it in `finally`.
- [x] 2.2 `app/(tabs)/asistente.tsx`: the `prestamo-nuevo` intent acquires the lock before `loanConsult.greet`, releases in `finally`.
- [x] 2.3 `app/(tabs)/asistente.tsx`: the focus-greeting effect acquires the lock before marking the session greeted and releases in `finally` (including the `/api/message` fallback).
- [x] 2.4 `app/(tabs)/asistente.tsx`: `handleConfirmLoan` acquires/releases the shared lock.
- [x] 2.5 `src/a2ui/actionBus.ts`: claim the lock before `sendAction`; skip the dispatch when a turn is in flight; release in `finally`; leave the client-routed `request_loan` branch lock-free.

## 3. Mutually exclusive mic / send

- [x] 3.1 `app/(tabs)/asistente.tsx`: mic button disabled while `isSending`; `handleMicPressIn`/`handleMicPressOut` early-return while `isSending`.
- [x] 3.2 `app/(tabs)/asistente.tsx`: `TextInput` editable only when `!inputBlocked`; send disabled for the full recording lifecycle; `handleIdleSendText` early-returns while blocked.
- [x] 3.3 `app/(tabs)/asistente.tsx`: show the `ActivityIndicator` in the send control while a turn is in flight.

## 4. Defensive leaf guards

- [x] 4.1 `src/features/voice/useSpeechToText.ts`: `startingRef`/`stoppingRef` so `start`/`stop` cannot re-enter.
- [x] 4.2 `src/features/loans/useLoanConsult.ts`: `inFlightRef` in `greet`/`send` (release in `finally`).

## 5. Verification

- [x] 5.1 `npm run typecheck` clean.
- [x] 5.2 `npm run lint` clean for the touched files (`eslint` runs in this environment; the earlier `unrs-resolver` note applied to a different setup).
- [ ] 5.3 Manual: double-tap send and return-key + tap → one backend request per turn. **MANUAL — on-device; not executable here.**
- [ ] 5.4 Manual: press the mic while a turn is pending → recording does not start; tap send while recording → no send. **MANUAL — on-device.**
- [ ] 5.5 Manual: press a surface action while a turn is pending → no `/api/action` request. **MANUAL — on-device.**
- [ ] 5.6 Manual: inject a timeout/error → controls re-enable and the next turn works. **MANUAL — on-device.**
- [x] 5.7 `openspec validate serialize-assistant-turns` (CLI available here as `openspec.cmd`).
