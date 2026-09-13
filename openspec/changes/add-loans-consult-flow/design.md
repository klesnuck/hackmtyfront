## Context

See `proposal.md` - Why/What Changes for motivation. Relevant current-state facts that shape this design:

- `src/api/client.ts`'s `apiRequest` assumes a JSON response body; it cannot be reused as-is for `/api/loans/greeting` and `/api/loans/consult`, which return `multipart/form-data`.
- `src/a2ui/actionBus.ts`'s `dispatchA2UIAction` is the sole, generic path from a catalog component to the network (`mobile/a2ui-engine` spec, "single dispatch function"). It has no concept of confirmation UI or of an action that bypasses `POST /api/action` entirely.
- `src/a2ui/registry.ts`'s `CatalogRegistry = Record<BasicNodeType, ...>` is a closed, compile-time-enforced union; both `standard` and `voz-color` must provide every key. The module's own comment already anticipates extending `BasicNodeType` with product-specific components.
- `app/(tabs)/asistente.tsx` owns one linear `turns[]` array and one `submitText` function hardcoded to `sendMessage` (`/api/message`). The loans conversation needs its own turn-loop function, its own transient `session_id`/`loan_request_id` (distinct from the app's login `session_id` used elsewhere), and its own terminal-surface handling.
- The backend's loans `session_id` (from `/api/loans/greeting`) is unrelated to and MUST NOT be conflated with the persistent login `session_id` in `useSessionStore` — it is scoped to one loan conversation only.

## Goals / Non-Goals

**Goals:**
- Make the documented backend loans contract (API_KNOWLEDGE.md §6) actually reachable and renderable from the Asistente tab.
- Keep the "one dispatch function" and "closed catalog union" invariants intact by extending them in one documented place each, not bypassing them ad hoc from inside a component.

**Non-Goals:**
- Building `DebtNode`, `TradeoffScale`, `BreakAlert`, `PlanTable`, `OfferCard`, or `NegotiationTranscript` — those belong to La Mesa/El Revés, unaffected by this change.
- Building a real NLU/intent classifier. Loan-intent detection is a small, explicit, client-side heuristic — good enough to route a hackathon demo correctly, not a general-purpose classifier.
- Changing the Préstamos tab's list screen — it already reads real liabilities and will pick up a newly disbursed loan once caches are invalidated.

## Decisions

**1. A dedicated multipart parser, not a library.** `src/api/multipart.ts` exposes one function, e.g. `parseMultipartJsonPart(response, partName)`: reads the boundary from the `Content-Type` header, reads the body via `response.arrayBuffer()`, scans for the named part's `Content-Disposition` header, and decodes only that part's byte range with `TextDecoder` before `JSON.parse`. It never attempts to decode the binary `audio` part. *Alternative considered*: pulling in a multipart-parsing dependency — rejected, since the only thing we need out of the response is one named JSON part, and the project already avoids adding dependencies for small, boundable problems (see `client.ts`'s comment on not using axios).
- The JSON payload's own `audio_ref` is used with the existing `playAudioAsset(audioRef, baseUrl)` / `getAudioAssetUrl` helpers instead — the inline binary `audio` part is simply skipped, eliminating any need to reassemble playable audio from raw multipart bytes.

**2. Loan-intent detection is a pure function, called once per fresh conversation.** `detectsLoanIntent(text: string): boolean` (new, colocated with the loans-assistant feature) checks the first user turn against a small Spanish keyword/phrase list ("préstamo", "crédito", "pedir prestado", "financiar", "pedir dinero prestado", etc.). It runs only when a conversation has no turns yet (mirrors the existing `hasSentInitialIntent` one-shot pattern) and only when no explicit `intent` route param already decided the mode. Ambiguous/no-match defaults to the existing La Mesa path — a false negative just behaves like today; a false positive is the risk worth avoiding, so the list stays deliberately narrow. *Alternative considered*: asking the backend to classify intent - rejected because `API_KNOWLEDGE.md` documents `/api/message` and `/api/loans/*` as two independent tracks with no such endpoint; adding one is backend scope outside this change.

**3. `app/(tabs)/asistente.tsx` gains a `mode` union (`'la-mesa' | 'loans'`), not a second screen.** Once a conversation resolves to `'loans'` (via explicit intent param or the detector), every subsequent `submitText` call in that conversation goes through a new `useLoanConsult`-style turn function instead of `sendMessage`, reusing the same `turns[]`/bubble rendering and the same `<A2UISurface>` for the terminal offer. The mode resets whenever the turn list resets (same `useFocusEffect` that already resets `manualActive`).

**4. The loans conversation's `session_id`/`loan_request_id` live in a small dedicated hook's local state, not in `useSessionStore`.** They are scoped to one on-screen conversation and never need to survive an app restart, unlike the persisted login session. The hook exposes: `greet(userId)`, `send(text | audioB64)` (loops internally while `terminal_response == null`, only returns once there's either a terminal surface or an error), and the current `loanRequestId`.

**5. `dispatchA2UIAction` gains one optional parameter, not a hidden special case inside a component.** Its signature grows an optional `onLoanRequest?: (resolvedContext) => void`. When `eventDef.name === 'request_loan'`, it resolves context exactly as for any other action, then calls `onLoanRequest` (if provided) instead of `sendAction`/`POST /api/action`, and returns without touching the surface store. `app/(tabs)/asistente.tsx` is the only caller that passes `onLoanRequest`, wiring it to open the confirmation step and, on confirm, call `POST /api/loans` with `user_id` (from `useSessionStore`) and `loan_request_id` (from the loans-consult hook) plus the resolved `amount`. If `request_loan` fires with no handler wired (e.g., from the Kill Test viewer), it dev-warns and no-ops rather than mis-routing to `/api/action`. *Alternative considered*: having the `LoanOffer` component itself call the loans API directly - rejected, since it would violate the `mobile/a2ui-engine` invariant that no catalog component talks to the network directly, and would scatter loan-creation logic away from the one place that already holds `loan_request_id`.

**6. `LoanOffer` is one component with internal sections, not several new catalog types.** The risk panel and warnings are not separate catalog components (the backend doc treats `/loan/risk` and `/loan/warnings` as data to read, not as distinct component types) — `LoanOffer`'s own implementation renders header terms, a collapsible amortization table, a risk/warnings section, and the accept/decline buttons, all from its own bound props. This keeps the catalog surface-area addition small (`LoanOffer`, `Heading`, `Badge`, `ProgressBar`) instead of one new type per visual section.

**7. `voz-color` gets working aliases before bespoke styling.** To satisfy the closed-union compile-time parity check, `voz-color`'s registry re-exports `standard`'s `LoanOffer`/`Heading`/`Badge`/`ProgressBar` initially (same pattern already used there for `Card`, `Tabs`, `Modal`, etc.) — matches `mobile/catalog-accessible`'s existing "functional, visual parity pending" precedent.

**8. Cache invalidation after acceptance is explicit, not automatic.** The confirm-and-create handler in `asistente.tsx` invalidates the TanStack Query keys used by `getLiabilities`/`getAccounts` (whatever `fetchLoans`/Inicio's balance query already key on) immediately after a successful `POST /api/loans`, rather than relying on a global refetch-on-focus policy that might not fire before the user switches tabs.

## Risks / Trade-offs

- **[Risk]** The keyword-based intent detector will misclassify some phrasing (e.g., "¿cuánto debo de mi tarjeta de crédito?" could false-positive on "crédito"). → Mitigation: keep the list narrow and biased toward precision over recall (default to La Mesa on doubt, per Decision 2); this is explicitly a demo-grade heuristic, not a claim of real NLU — flagged here rather than hidden.
- **[Risk]** Manually parsing `multipart/form-data` byte ranges is easy to get subtly wrong (boundary variants, trailing `--`, CRLF handling). → Mitigation: unit-test `parseMultipartJsonPart` against a captured real response fixture from `/api/loans/greeting` before wiring it into the UI.
- **[Risk]** `POST /api/loans` disburses immediately and irreversibly; a double-submit (e.g., a second tap before the first request resolves) would create two loans. → Mitigation: disable the confirm affordance while the request is in flight, same pattern as the existing `isSending` guard in `asistente.tsx`.
- **[Trade-off]** Scoping `LoanOffer` as one large internal component (Decision 6) is simpler to ship but means its internal sections (schedule table, risk breakdown) are not independently reusable by other surfaces. Acceptable: nothing else in the documented catalog needs them yet.

## Migration Plan

Additive only — no existing requirement's externally observable behavior regresses (the `a2ui-engine` change only adds a named exception; the catalog changes only add types). No data migration. Rollback is deleting the new files and the `BasicNodeType` additions; existing La Mesa/Saving Bags flows are untouched by every decision above.
