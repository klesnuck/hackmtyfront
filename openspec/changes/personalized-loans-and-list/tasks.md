## 1. List (fixes the empty tab)

- [x] 1.1 Backend: `list_loans`/`get_loan` MCP tools; `loans.purpose`/`purpose_private` columns
- [x] 1.2 Backend: `GET /api/loans?user_id=` unified list (created loans + active liabilities)
- [x] 1.3 Frontend: `listLoans` endpoint + `fetchLoans` mapping; render both in the tab

## 2. Purpose + private

- [x] 2.1 Backend: private-intent detection in `agent/loans.py`; intake offers the private option
- [x] 2.2 Backend: persist purpose on `create_loan`; resolve purpose from loan request on `POST /api/loans`
- [x] 2.3 Frontend: "Solicitar préstamo" modal calls `POST /api/loans`

## 3. Per-loan detail

- [x] 3.1 Backend: `agent/loan_detail.py` generate-or-hydrate + deterministic fallback
- [x] 3.2 Backend: `find_surface` tool + `loan_context` merged during hydration
- [x] 3.3 Backend: `GET /api/loans/{loan_id}/ui`
- [x] 3.4 Frontend: `app/loan/[id].tsx` screen rendering `<A2UISurface>` with the backend's catalog

## 4. Personalization + research

- [x] 4.1 Backend: pin `voz-color` for `simple` audience; tone/emoji directive; `activityScore`
- [x] 4.2 Backend: `research_topic` (Gemini grounding + static fallback); private skips it
- [x] 4.3 Frontend: `voz-color` Text/Card/Badge are tone/color-first

## 5. Verification

- [x] 5.1 Backend suite green (251 tests, +6 new)
- [x] 5.2 `npm run typecheck` clean
- [x] 5.3 `openspec validate` clean
- [ ] 5.4 Manual: create via the modal → appears in the tab → tap → personalized page; reopen re-hydrates; `u_don` gets the emoji/color page, a private reason performs no research

## 6. Informational detail (fix: taken loans were shown as offers)

- [x] 6.1 Backend: strip `LoanOffer`/`request_loan` deterministically; require the summary component
- [x] 6.2 Backend: recompute risk via `propose_offer` + distribution/payoff in the detail context
- [x] 6.3 Backend: `liability_detail` domain + `GET /api/liabilities/{id}/ui` + `abonar` action
- [x] 6.4 Backend: no speech/`audio_ref` for detail domains
- [x] 6.5 Frontend: `LoanSummary` + `LiabilitySummary`; route `abonar`; `app/liability/[id].tsx`; no TTS
