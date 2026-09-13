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
  (`engine/loan_offer.py::term_options`: 6/12/24/36/48 months, each with the real
  monthly payment, total interest, total cost and CAT) and picks the **recommended
  plazo from the applicant's profile, payment likelihood/behavior and requested
  amount** — not a fixed 24 months. The recommendation balances total interest
  against the monthly burden with a risk weight (income/expense volatility, thin
  liquidity, payment history, subscription load, tight quincena, savings goal,
  amount relative to income). The offered term is the recommended one, so
  `LoanOffer`'s headline (term, payment, CAT, schedule) agrees with the highlighted
  card, and a short reason is attached.
- Both terminal paths use those options for `ScenarioComparison`:
  `agent/loans_fallback.py` builds the card set from them, and `agent/loans.py`
  deterministically overrides any model-emitted `ScenarioComparison.scenarios`
  with them. The debt-payoff scenarios remain in the La Mesa / El Revés flows.
- The prompt instructs the model to use `options` (label "N meses") and no longer
  frames the scenario cards as the debt analysis; the `simple` audience now gets
  the plazo cards in plain language instead of being denied them.
- Frontend: `ScenarioComparison` hides the redundant "Plazo" row when a card's
  label is already a term ("12 meses"), marks the recommended term, and shows the
  optional recommended-card note (the reason).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `mobile/loans-assistant`: the terminal offer compares loan payment terms
  (plazos), engine-backed, with the recommended term highlighted.
- `mobile/catalog-standard`: `ScenarioComparison` term cards are labeled by term
  without a duplicated "Plazo" row, and the highlighted term is marked.

> `mobile/loans-assistant` and the `ScenarioComparison` requirement are
> introduced by the still-pending `add-loans-consult-flow` and
> `harden-loans-consult-sync`. Classify these deltas as MODIFIED if those are
> archived first, otherwise ADDED (used here).

## Impact

- Frontend: `src/catalog/standard/ScenarioComparison.tsx`, this change folder.
- Backend (separate repo): `engine/loan_offer.py`, `agent/loans_fallback.py`,
  `agent/loans.py`, and their tests.
- No invariant or wire-contract change: `ScenarioComparison` keeps the same
  component and props (`payoffMonths` is reused with plazo semantics).
- Verification: backend suite green; `npm run typecheck`; `openspec validate`.
