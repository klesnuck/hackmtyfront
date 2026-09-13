## Why

The loans consultation jumped straight to the largest possible offer whenever the
AI was unsure, and then stayed there. Two root causes:

1. The requested amount was never persisted across turns. `consult` extracted it
   only from the current message, so any later turn ("sí", "¿y el interés?") called
   `compute_loan_offer(requested_amount=0)`, which the engine resolves to
   `amount = max_principal` — the maximum the user can afford. The DB shows
   persisted terminals for `u_don` at exactly the maximum.
2. The deterministic fallback always fabricated an affordable offer from that
   maximum when the model failed/timed out or returned a low-confidence terminal,
   and the prompt marked the offer "obligatoria en terminal_response". So an
   unclear or failed turn became "here is the maximum" and ended the flow.

The result read as stiff and pushy: no intake, no reaction to the user, and a
silent ceiling.

## What Changes

- **Intake first.** Until the user gives an amount (or explicitly asks for the
  maximum), the consult asks naturally for the missing amount and/or purpose and
  returns `terminal_response: null`; no offer is built or persisted. The model
  writes the question; a deterministic question is used if it fails.
- **Persisted negotiation state.** `loan_requests.context_json` now carries
  `requested_amount`, `purpose`, `use_max`, `requested_term`, `term_confirmed`,
  `purpose_asked`; the amount survives across turns, so the offer (and the created
  loan) stay at what the user asked for — never an accidental maximum.
- **Explicit maximum honored.** Phrases like "el máximo", "lo que me puedas dar"
  or "tú dime" legitimately request the engine maximum.
- **Fallback intake mode.** `loans_fallback.build_terminal` asks instead of
  offering when there is no amount and no maximum request.
- **Prompt rework.** The offer mandate is conditional ("once you have the amount");
  an intake instruction asks for what is missing; the state and prior turns are
  included.
- **Latency budget.** `LOANS_LLM_DEADLINE_SECONDS` 4.0 → 6.5, `LOANS_MAX_TOKENS`
  900 → 1500, a new `LOANS_INTAKE_DEADLINE_SECONDS=3.5` for the short intake turn,
  the per-month `schedule` is trimmed from the model prompt (it binds
  `/loan/schedule`), the analysis payload is trimmed, history is capped, and the
  frontend client timeout is 8s → 12s. `consult` now traces/logs the real
  fallback reason.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `mobile/loans-assistant`: the assistant collects amount and purpose before
  offering, keeps the amount across turns, honors an explicit maximum, and only
  then renders the terminal offer.

> `mobile/loans-assistant` is introduced by the still-pending `add-loans-consult-flow`
> and `harden-loans-consult-sync`; classify as MODIFIED if those are archived first,
> otherwise ADDED (used here).

## Impact

- Backend (separate repo): `agent/loans.py`, `agent/loans_fallback.py`,
  `api/routers/loans.py`, `config.py`, `.env.example`, and their tests.
- Frontend: `src/api/endpoints.ts` (loans client timeout).
- No invariant or wire-contract change: an intake turn reuses the existing
  `{response_text, terminal_response: null}` shape, so it renders as an assistant
  bubble and keeps the conversation open.
- Verification: backend suite green; `npm run typecheck`; `openspec validate`.
