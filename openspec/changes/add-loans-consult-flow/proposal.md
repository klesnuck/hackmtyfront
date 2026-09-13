## Why

The Asistente tab only drives La Mesa (`POST /api/message`, debt restructuring). The backend already exposes a separate, fully-specified loans conversation (`API_KNOWLEDGE.md` §6: `/api/loans/greeting` → `/api/loans/consult` loop → a `LoanOffer` terminal surface computed from the user's real transactions/payment history) that the client never calls, and even if it did, the client's A2UI catalog has no `LoanOffer` component to render it with — the loans terminal surface would render as empty space today. Without this change, "ask the assistant for a loan" is not a real capability of the app; it is only documented backend surface area.

## What Changes

- Add a typed client for the loans conversation contract: `/api/loans/greeting`, `/api/loans/consult`, `POST /api/loans`, `GET /api/loans/{loan_request_id}` — including a manual `multipart/form-data` response parser (React Native `fetch` does not parse multipart responses natively), extracting the JSON `payload` part and reusing the existing `playAudioAsset(audio_ref, baseUrl)` helper for speech instead of decoding the inline audio part.
- Give the Asistente tab (`app/(tabs)/asistente.tsx`) intent detection: a conversation whose opening user turn (typed or transcribed) reads as a loan request switches that conversation from the `/api/message` (La Mesa) loop to the `/api/loans/greeting` + `/api/loans/consult` loop for its remaining turns. The existing `intent` route param (used by `app/asistente-prestamos.tsx`'s quick actions) gains a third explicit value so a deliberate quick-action tap is deterministic; free-form entry falls back to a client-side keyword heuristic, defaulting to the existing La Mesa path when ambiguous so current behavior does not regress.
- Add the `LoanOffer` catalog component (plus small supporting components: `Heading`, `Badge`, `ProgressBar`) to both the `standard` and `voz-color` catalogs — rendering the offer terms, amortization schedule, the risk panel (`/loan/risk`: DTI, liquidity buffer, income stability, savings impact, payment history) and `warnings[]` as sent by the backend, display-only, never recomputed client-side.
- **BREAKING (internal only):** extend `dispatchA2UIAction` (`src/a2ui/actionBus.ts`) with the documented client-routing exception: an action named `request_loan` is never sent to `POST /api/action` — instead it opens a confirmation step and, on explicit confirm, calls `POST /api/loans` directly (real disbursement). Every other action name is unaffected.
- Add a confirmation step before accepting a `LoanOffer` (e.g., "¿Confirmas un préstamo de $X a Y meses?") — disbursement is immediate and irreversible, so a bare single tap is not enough.
- Invalidate the `liabilities`/`accounts` TanStack Query caches after a successful `POST /api/loans` so the Préstamos tab (`fetchLoans`/`getLiabilities`, already real) and the Inicio balance reflect the new loan without a manual refresh.

## Capabilities

### New Capabilities
- `mobile/loans-assistant`: the AI-driven loan conversation — intent detection on the Asistente tab, the greeting/consult loop, rendering the terminal `LoanOffer` + risk surface, the confirm-then-accept/reject actions, and the resulting real loan registration.

### Modified Capabilities
- `mobile/catalog-standard`: catalog coverage grows beyond the 18 A2UI "basic" types to include `LoanOffer`, `Heading`, `Badge`, `ProgressBar`.
- `mobile/catalog-accessible`: same new component types, rendered with the accessible catalog's styling.
- `mobile/a2ui-engine`: the single action-dispatch path gains one documented, named exception (`request_loan` is client-routed, not sent to `POST /api/action`).

## Impact

- New/changed files: `src/api/types.ts`, `src/api/endpoints.ts`, a new `src/api/multipart.ts` parser, `src/a2ui/actionBus.ts`, `src/a2ui/registry.ts` (`BasicNodeType` union), `src/catalog/standard/*`, `src/catalog/voz-color/*`, `app/(tabs)/asistente.tsx`, `app/asistente-prestamos.tsx` (third quick action).
- Coordinates with, but does not duplicate, the still-open `add-loans-management` change: that change's `mobile/loans` capability (Préstamos tab list + manual, conversation-free application) already reads real liabilities via `getLiabilities`/`fetchLoans` — a loan created by this change's flow surfaces there automatically once caches are invalidated, no list-rendering work needed here.
- No new dependencies; multipart parsing is hand-rolled against the raw response body.
