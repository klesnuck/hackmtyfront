## Why

The loans consult was failing in a way neither side could see. Real server traces
showed the backend calling the LLM twice, then rejecting its own model's output
(`messages[1]: <updateComponents> is not valid under any of the given schemas`)
and returning `200 {status:"error", error_code:"agent_error"}`. The Asistente
screen never renders `status:'error'` (nor `loanConsult.errorMessage`), so the
user got no bubble, no surface, and no retry — it looked like the app was frozen.
Two contract mismatches caused the rejection: the backend prompt asked for a bare
`action` string and `{{...}}` placeholders on numeric `LoanOffer` props, while the
A2UI schema requires an `Action` object and a number/binding.

Separately, catalog drift makes the terminal unrenderable even when valid: the
loans prompt mandates `ScenarioComparison`, `PlanTable`, `ForecastChart`,
`LineChart`, and `BreakAlert`, but the mobile `CatalogRegistry` implements none of
them (unknown node types render as nothing in production). And the consult took
~20–30 s (two LLM calls of ~9–12 s each), well past an acceptable budget.

This change fixes the client half of that synchronization and locks a 5 s
contract: errors are always visible, turns never exceed ~5 s, and every component
the backend emits for a loans terminal has a real implementation.

## What Changes

- **Always-visible errors:** `app/(tabs)/asistente.tsx` renders `status:'error'`
  consults as a Spanish bubble (mapped from `error_code`, falling back to
  `message`) with a retry affordance when `retryable`; `loanConsult.errorMessage`
  is surfaced. No consult error is silent again.
- **5 s consult contract (client side):** `loansGreeting`/`loansConsult` use an
  `AbortController` timeout (~8 s, above the server's ~5 s budget) and surface a
  handled timeout message. The backend guarantees the deadline via a hard LLM cap
  plus a deterministic fallback terminal.
- **Conversation identity is correct:** `useLoanConsult` keeps `sessionId` and
  `loanRequestId` in refs set synchronously by `greet`/`send`, so a turn that
  greets and consults in one user action uses the right session.
- **Terminal component coverage:** implement `ScenarioComparison`, `PlanTable`,
  `ForecastChart`, `LineChart`, and `BreakAlert` in `catalog/standard` (re-exported
  by `catalog/accessible`), extending the closed `BasicNodeType` union so a missing
  implementation is a compile error, not a blank screen.
- **Audio refs are used verbatim:** `getAudioAssetUrl` accepts a bare `audio_id`
  or the backend's absolute `audio_ref` and never prepends `/api/audio/` twice.
- **LoanOffer is only acceptable when there is an amount:** the accept affordance
  is hidden when `amount <= 0` (not-eligible), so a zero offer can never be
  submitted.
- **Documentation:** the demo personas are documented (`demo`/`u_ana` is not
  eligible; use `roberto`/`sofia`/`carmen` to see an offer).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `mobile/loans-assistant`: error surfacing, the 5 s/timeout contract, session
  identity correctness, not-eligible behavior, and the terminal component set.
- `mobile/catalog-standard`: adds `ScenarioComparison`, `PlanTable`,
  `ForecastChart`, `LineChart`, `BreakAlert`.
- `mobile/catalog-accessible`: same five component types (functional parity).
- `mobile/a2ui-engine`: backends send `Action` objects and numeric props as
  numbers/bindings; unknown component types are a contract violation, surfaced in
  dev.

## Impact

- Changed files: `app/(tabs)/asistente.tsx`,
  `src/features/loans/useLoanConsult.ts`, `src/api/endpoints.ts`,
  `src/api/types.ts`, `src/a2ui/registry.ts`, `src/catalog/standard/index.ts`,
  `src/catalog/voz-color/index.ts`, `src/catalog/standard/{ScenarioComparison,
  PlanTable,ForecastChart,LineChart,BreakAlert,charting}.tsx`, and
  `src/catalog/standard/LoanOffer.tsx`.
- Depends on the backend change (amitie/backend): `ui_contract/normalize.py`,
  the single-attempt deadline in `agent/loans.py`, and `agent/loans_fallback.py`.
  The backend is a separate repository; this change assumes its REQ-LM-12/REQ-LM-13.
- No new dependencies: charts use the already-declared `react-native-svg`.
- No invariant change: `INV-010` (HTTP only) is preserved; websockets are
  explicitly rejected as the fix (see `design.md`).
- Verification: `npm run typecheck` and `npm run lint` (no test runner in this
  repo) plus a manual run against the backend.
