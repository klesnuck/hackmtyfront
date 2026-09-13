## Context

The loans terminal is produced two ways: a single structured LLM call
(`agent/loans.py`) and a deterministic fallback (`agent/loans_fallback.py`) used
on timeout/provider failure/invalid output. Both persisted a `ScenarioComparison`
built from the debt-payoff analysis (`engine/loans_analysis.py::analyze`), which
is meaningless for a debt-free applicant. The engine already computes per-term
terms via `engine/loan_offer.py::terms_for`, so no client-side math is needed.

## Goals / Non-Goals

**Goals:**
- The comparison cards show the offered loan's plazos with real payment and total
  interest, for every applicant, including debt-free ones.
- The figures are engine-backed and identical across the LLM and fallback paths.
- A small, honest frontend change so term cards read cleanly.

**Non-Goals:**
- A new A2UI component: `ScenarioComparison` already models a labeled comparison
  with `monthlyPayment`, `payoffMonths`, and `totalInterest`.
- Changing the La Mesa / El Revés debt scenarios (they keep `analyze`).
- Any transport or invariant change.

## Decisions

**1. Add `term_options` to the engine.** `terms_for` already produces the terms
for a fixed principal; `term_options` maps it over 6/12/24/36/48. Pure,
deterministic, `INV-015`; exposed through the existing `compute_loan_offer`
result as `options` (no new MCP tool).

**2. Recommend a plazo from the applicant, not a constant.** A risk-weighted
score trades total interest (favored by strong, stable profiles) against the
monthly burden (favored by income/expense volatility, thin liquidity, weak
payment history, subscription load, a tight quincena, a savings goal at risk, or a
large amount relative to income). `w_burden = clamp(0.25 + 0.55·risk, 0.25, 0.80)`.
Only plazos whose payment fits the affordable ceiling are eligible; if none fit,
the longest is recommended. The chosen term also becomes the offer's term, so the
`LoanOffer` headline and the highlighted card agree, and a short plain-Spanish
reason is attached. This is why `recommended` can no longer be `months == 24`.

**3. Deterministic override on the LLM path.** Even with a prompt instruction, a
weaker model under `PR_SWITCH` could emit the debt scenarios again. After
validation, `agent/loans.py` replaces any `ScenarioComparison.scenarios` with the
engine options (or appends one to a container if absent), so correctness does not
depend on model adherence. The fallback builds the same component from `options`
via the shared `loans_fallback.scenario_component`.

**4. Keep `ScenarioComparison`; reuse `payoffMonths` as the plazo.** Introducing a
new component/prop would be a breaking catalog change; the existing shape fits
("Plazo" + "Interés total"). `interestSaved`/`monthsSaved` are simply omitted for
term cards. The recommended reason rides an optional `note` inside the scenario
object — the `scenarios` prop is `any`, so no catalog/schema change.

**5. Term-label-aware rendering.** The card title now carries the term, so the
generic "Plazo" row is redundant; hide it only when the label is a term, leaving
the debt-scenario layout untouched, mark the highlighted term as recommended, and
render its `note` when present.

**6. Allow plazo cards for the `simple` audience.** The previous directive denied
`ScenarioComparison` to `simple`, but the plazo cards are plain language (term,
payment, total interest) and are the core value of the offer; prohibit CAT/DTI/
charts/risk instead.

**7. Amount-banded plazos.** Long terms on a small loan are pointless, so the
candidate set comes from `allowed_terms_for(amount)` bands (a small loan gets
6/12; larger loans add 24/36/48). The selected term and any user-requested term
are always added. The band uses the **offered** amount (the affordable principal),
not the raw requested amount.

**8. A user-stated term is confirmed, never ignored.** When the user names a term,
`_extract_term` records it in the loan conversation state (`requested_term`,
`term_confirmed`), and until they confirm the backend returns a deterministic
confirmation turn (`terminal_response = null`) that acknowledges the term and
states the real implications from the engine (monthly payment, share of income,
total interest, comparison to the recommendation; if unaffordable, say so). Only
on confirmation does the terminal build at that term, and `create_loan` honors the
chosen term instead of overwriting it with the stored offer's. Passing the state
back into every turn (and re-stating it to the model) keeps the conversation
consistent across turns.

## Risks / Trade-offs

- **[Risk]** The recommendation is a heuristic, so it could surprise. → It is
  deterministic, feasibility-gated (never recommends an unaffordable payment),
  always within the 6–48 product range, and carries a plain-language reason.
- **[Risk]** The confirmation adds a turn before the offer. → It is the point: the
  user asked for a term and must not be overridden silently; the turn is short and
  deterministic.
- **[Risk]** Affirmative detection is keyword-based. → Only consulted when a term
  is pending; anything else re-asks rather than proceeding, so a false negative is
  harmless (a re-ask), and a new term in the same message takes precedence.
- **[Risk]** The `simple` mandate change loosens a prior audience rule. → Scoped
  to the loan-term comparison only; advanced metrics stay excluded.
- **[Risk]** Overwriting the model's component could conflict with a future
  component shape. → Confined to `ScenarioComparison.scenarios`/`highlightIndex`;
  persistence re-validates.
