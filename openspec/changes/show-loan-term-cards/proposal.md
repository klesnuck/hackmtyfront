## Why

After the assistant offers a loan, the terminal's comparison cards rendered the
backend's **debt-payoff** scenarios (`engine/loans_analysis.py::analyze`) instead
of the loan's payment terms. For a user with no existing debt (`u_don`), that
analysis is degenerate, so every card read "Plazo 1 meses" and "Interés total
$0" — a persisted payload literally contained
`{"label":"Pago mínimo","monthlyPayment":0,"payoffMonths":1,"totalInterest":0}`.

The cards are supposed to compare **payment terms (plazos)** for the offered
loan. The frontend was rendering the payload faithfully (`ScenarioComparison.tsx`
reads `payoffMonths`/`totalInterest`; `resolve.ts` passes arrays through), so the
defect is the data the backend produced, not client-side math.

## What Changes

- The backend computes engine-backed plazo options for the offered amount
  (`engine/loan_offer.py::term_options`), limited to **amount bands** so small
  loans only offer short terms (each option with the real monthly payment, total
  interest, total cost and CAT), and picks the **recommended plazo from the
  applicant's profile, payment likelihood/behavior and requested amount** — not a
  fixed 24 months. The recommendation balances total interest against the monthly
  burden with a risk weight (income/expense volatility, thin liquidity, payment
  history, subscription load, tight quincena, savings goal, amount relative to
  income). The selected term is the term the offer itself is presented at, so
  `LoanOffer`'s headline (term, payment, CAT, schedule) agrees with the highlighted
  card, and a short reason is attached.
- A **user-stated term is honored, not ignored**: `agent/loans.py` extracts it,
  keeps it in the conversation state across turns, and until the user confirms it
  returns a deterministic confirmation turn that explains the real implications
  (monthly payment, share of income, total interest, comparison to the
  recommendation; if unaffordable, that it exceeds capacity and alternatives).
  Only on confirmation does the offer build at that term, and `create_loan` creates
  at that term.
- Both terminal paths use those options for `ScenarioComparison`:
  `agent/loans_fallback.py` builds the card set from them, and `agent/loans.py`
  deterministically overrides any model-emitted `ScenarioComparison.scenarios`
  with them. The debt-payoff scenarios remain in the La Mesa / El Revés flows.
- The prompt instructs the model to use `options` (label "N meses"), to respect a
  user-stated term, and to stay consistent with prior turns; the `simple` audience
  now gets the plazo cards in plain language instead of being denied them.
- Frontend: `ScenarioComparison` hides the redundant "Plazo" row when a card's
  label is already a term ("12 meses"), marks the selected term ("Recomendado", or
  "Tu plazo" when it is the user's), and shows the optional note (the reason).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `mobile/loans-assistant`: the terminal offer compares loan payment terms
  (plazos), amount-banded, engine-backed, with the selected/recommended term
  highlighted; a user-stated term is confirmed with its implications before it is
  offered and persists across turns.
- `mobile/catalog-standard`: `ScenarioComparison` term cards are labeled by term
  without a duplicated "Plazo" row, and the selected term is marked
  ("Recomendado" / "Tu plazo") with its optional note.

> `mobile/loans-assistant` and the `ScenarioComparison` requirement are
> introduced by the still-pending `add-loans-consult-flow` and
> `harden-loans-consult-sync`. Classify these deltas as MODIFIED if those are
> archived first, otherwise ADDED (used here).

## Impact

- Frontend: `src/catalog/standard/ScenarioComparison.tsx`, this change folder.
- Backend (separate repo): `engine/loan_offer.py`, `agent/loans_fallback.py`,
  `agent/loans.py`, `api/routers/loans.py`, `mcp_servers/finance/{service,server}.py`,
  and their tests.
- No invariant or wire-contract change: `ScenarioComparison` keeps the same
  component and props (`payoffMonths` is reused with plazo semantics; `requested`
  and `note` ride inside the `scenarios` `any` prop).
- Verification: backend suite green; `npm run typecheck`; `openspec validate`.
