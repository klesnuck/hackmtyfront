## 1. Frontend rendering

- [ ] 1.1 `src/catalog/standard/ScenarioComparison.tsx`: hide the "Plazo" row when a scenario label is a term (`/^\d+ meses$/i`); keep it for debt labels.
- [ ] 1.2 `src/catalog/standard/ScenarioComparison.tsx`: mark the highlighted term card ("Recomendado", or "Tu plazo" when `requested`) and render its optional `note`.

## 2. Backend (separate repo — `amitie/backend`)

- [ ] 2.1 `engine/loan_offer.py`: add amount bands (`allowed_terms_for`) and `term_options(..., recommended_months, requested_term)`; include `requested` flags.
- [ ] 2.2 `engine/loan_offer.py`: `propose_offer(..., requested_term=...)` presents the offer at the selected term (user-requested when given), returns the selected/engine-recommended terms and a `capacity` block.
- [ ] 2.3 `agent/loans.py`: `_extract_term`, affirmative/negative detection, conversation state (`requested_term`/`term_confirmed`), the deterministic confirmation turn with real implications, and prompt/state consistency.
- [ ] 2.4 `agent/loans_fallback.py`: scenario object carries `requested`; highlight the selected term; `note` reason.
- [ ] 2.5 `api/routers/loans.py`: persist/read `requested_term`/`term_confirmed` in `loan_requests.context_json`.
- [ ] 2.6 `mcp_servers/finance/{service,server}.py`: `compute_loan_offer(requested_term=...)`; `create_loan` honors the chosen term (validated 6–48) instead of forcing the stored one.
- [ ] 2.7 Tests: engine bands + requested term; consult confirmation→honored flow; `create_loan` term.

## 3. Verification

- [ ] 3.1 Backend: `python3 -m unittest discover -s tests -t .` green.
- [ ] 3.2 `npm run typecheck` clean.
- [ ] 3.3 `npx -y @fission-ai/openspec validate --all` green.
- [ ] 3.4 Manual: small-amount offer shows only short plazos; stating a term yields a confirmation with real implications; confirming builds the loan at that term; the conversation stays consistent across turns.
