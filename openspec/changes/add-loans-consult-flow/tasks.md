## 1. API layer

- [ ] 1.1 Add types to `src/api/types.ts` per `API_KNOWLEDGE.md` §14: `LoansGreetingPayload`, `LoansConsultPayload`, `LoanScheduleRow`, `LoanTerms`, `LoanRisk`, `LoansCreateRequest`, `LoanResponse`.
- [ ] 1.2 Add `src/api/multipart.ts` with `parseMultipartJsonPart(response, partName)`: extract the boundary from `Content-Type`, read `response.arrayBuffer()`, locate the named part by its `Content-Disposition` header, decode only that byte range with `TextDecoder`, `JSON.parse` it.
- [ ] 1.3 Write a unit test for `parseMultipartJsonPart` against a captured real `/api/loans/greeting` response fixture (payload + audio parts), including a case with the audio part omitted (TTS unavailable).
- [ ] 1.4 Add endpoint functions to `src/api/endpoints.ts`: `loansGreeting(userId)`, `loansConsult(request)` (both using the multipart parser), `createLoan(request)`, `getLoanRequest(loanRequestId)` (plain JSON).

## 2. Loan intent detection and conversation hook

- [ ] 2.1 Add `detectsLoanIntent(text: string): boolean` (small Spanish keyword/phrase check) colocated with the new feature code.
- [ ] 2.2 Add a `useLoanConsult`-style hook: holds `sessionId`, `loanRequestId`, `status` (`idle | intake | terminal | error`); exposes `greet(userId)` and `send(text | audioB64)`; `send` loops internally on `loansConsult` while `terminal_response == null` and resolves once there's a terminal surface, a conversational reply, or an error.
- [ ] 2.3 Handle the "amount = 0 / not eligible" case: no terminal surface, just show `response_text` as a normal reply.
- [ ] 2.4 Handle error codes from `API_KNOWLEDGE.md` §1 (`provider_unavailable`, `model_call_limit`, `agent_error`, `transcription_failed`, `bad_request`) with the documented Spanish copy and retry affordance where `retryable` is true.

## 3. Action-bus exception for `request_loan`

- [ ] 3.1 Extend `dispatchA2UIAction` in `src/a2ui/actionBus.ts` with an optional `onLoanRequest?: (resolvedContext) => void` parameter; when `eventDef.name === 'request_loan'`, resolve context as usual, call `onLoanRequest` if provided, and return without calling `sendAction`.
- [ ] 3.2 Dev-warn (no-op) if `request_loan` fires with no `onLoanRequest` wired, instead of silently falling through to `POST /api/action`.

## 4. Catalog: LoanOffer and supporting components

- [ ] 4.1 Extend `BasicNodeType` in `src/a2ui/registry.ts` with `LoanOffer`, `Heading`, `Badge`, `ProgressBar`.
- [ ] 4.2 Implement `Heading`, `Badge`, `ProgressBar` in `src/catalog/standard/` (small, reusable).
- [ ] 4.3 Implement `LoanOffer` in `src/catalog/standard/`: header (amount, apr, months, monthly payment, "CAT (aproximado)", total cost), a collapsible amortization schedule table, a risk/warnings section reading `/loan/risk` and `/loan/warnings` from the data model (display-only), and accept/decline buttons wired through the standard `action.event` path (`request_loan` for accept; decline is local-only, no `action.event` needed).
- [ ] 4.4 Register the four new components in `src/catalog/standard/index.ts`.
- [ ] 4.5 In `src/catalog/voz-color/index.ts`, register the same four components — re-exporting the `standard` implementations initially (matches the existing pattern for `Card`, `Tabs`, `Modal`, etc.).

## 5. Asistente tab wiring

- [ ] 5.1 Add a `mode: 'la-mesa' | 'loans'` piece of state to `app/(tabs)/asistente.tsx`, resolved once per fresh conversation from either the route's `intent` param or `detectsLoanIntent` on the first user turn; defaults to `'la-mesa'` when ambiguous.
- [ ] 5.2 Add a `'prestamo-nuevo'` value to the `INTENT_PROMPTS`-adjacent routing so an explicit quick action can set `mode: 'loans'` deterministically and call `greet(userId)` instead of sending a canned `/api/message` prompt.
- [ ] 5.3 When `mode === 'loans'`, route `submitText` calls through the loan-consult hook's `send()` instead of `sendMessage`; render its terminal surface through the existing `<A2UISurface>`; play `audio_ref` the same way the existing La Mesa path does.
- [ ] 5.4 Wire `dispatchA2UIAction`'s `onLoanRequest` (only for surfaces rendered in loans mode) to open the confirmation step.
- [ ] 5.5 Build the confirmation step (e.g. a `Modal`-based dialog): shows the offered amount and term, a confirm and a cancel affordance; disabled/loading while the creation request is in flight to prevent double-submit.
- [ ] 5.6 On confirm: call `createLoan({ user_id, amount, loan_request_id })`; on success, invalidate the TanStack Query keys backing `getLiabilities`/`getAccounts`; on `400`, show the rejection as a handled Spanish error, not a crash.
- [ ] 5.7 Add the "Solicitar un préstamo nuevo" quick action to `app/asistente-prestamos.tsx`, routing to `/asistente` with `intent: 'prestamo-nuevo'`.

## 6. Verification

- [ ] 6.1 `npm run typecheck`, `npm run lint` clean.
- [ ] 6.2 Manual run against the real backend (per `API_KNOWLEDGE.md` Playbook B) with the `demo`/`u_ana` and `accesible`/`u_don` accounts: greeting → consult loop → terminal `LoanOffer` renders with real figures → confirm → accept creates and disburses → Préstamos tab and Inicio balance reflect it without manual refresh.
- [ ] 6.3 Manual check of the decline path: offer dismissed locally, no network call fired.
- [ ] 6.4 Manual check of the not-eligible path (amount = 0): conversation stays open, no offer surface rendered.
- [ ] 6.5 Manual check that a free-form loan-shaped message typed directly on the Asistente tab (no quick action) is correctly detected and routed.
