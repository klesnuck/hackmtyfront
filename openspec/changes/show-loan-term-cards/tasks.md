## 1. Frontend rendering

- [ ] 1.1 `src/catalog/standard/ScenarioComparison.tsx`: hide the "Plazo" row when a scenario label is a term (`/^\d+ meses$/i`); keep it for debt labels.
- [ ] 1.2 `src/catalog/standard/ScenarioComparison.tsx`: mark the highlighted term card as "Recomendado" and render its optional `note`.

## 2. Backend (separate repo — `amitie/backend`)

- [ ] 2.1 `engine/loan_offer.py`: add `TERM_CANDIDATES` and `term_options(...)` (`recommended_months` flag); include `options` in `propose_offer`'s result.
- [ ] 2.2 `engine/loan_offer.py`: add `_risk_score`/`recommend_term` deriving the recommended plazo from profile, payment likelihood/behavior and the requested amount (never a fixed term); present the offer at the recommended plazo and attach a short reason.
- [ ] 2.3 `agent/loans_fallback.py`: add `scenario_component(options)`; build the terminal's `ScenarioComparison` from the offer options, including the recommended card's `note`.
- [ ] 2.4 `agent/loans.py`: instruct the prompt to use `options` (and the recommendation reason) for `ScenarioComparison` and to allow plazo cards for the `simple` audience; deterministically override the model's scenarios with the engine options before persistence.
- [ ] 2.5 Tests: `tests/test_loan_offer.py` (option values match `terms_for`; recommendation varies by profile and by requested amount; offer term == recommended term; reason present); `tests/test_loans_consult.py` fallback asserts the 5 plazo cards, the recommended card carries a `note`.

## 3. Verification

- [ ] 3.1 Backend: `python3 -m unittest discover -s tests -t .` green (234 passing).
- [ ] 3.2 `npm run typecheck` clean.
- [ ] 3.3 `npm run lint` clean (currently blocked in this environment by a pre-existing `unrs-resolver` native-binding failure).
- [ ] 3.4 `npx -y @fission-ai/openspec validate --all` green.
- [ ] 3.5 Manual: consult with the seeded personas and confirm the recommended plazo varies (e.g. `u_don`/`u_roberto` shorter, `u_sofia`/`u_carmen` longer) and the `LoanOffer` headline term matches the highlighted card.
