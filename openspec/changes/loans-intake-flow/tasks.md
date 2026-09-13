## 1. Backend (separate repo — `amitie/backend`)

- [ ] 1.1 `api/routers/loans.py`: persist/read `requested_amount`, `purpose`, `use_max`, `purpose_asked` (plus the existing term keys) in `loan_requests.context_json`.
- [ ] 1.2 `agent/loans.py`: `_extract_purpose`, `_wants_max`; intake gate (`has_amount`) that returns a clarifying turn with `terminal_response = null` and never persists an offer; amount/purpose persist across turns.
- [ ] 1.3 `agent/loans.py::_intake_response` + intake system prompt; deterministic fallback via `loans_fallback.intake_response`.
- [ ] 1.4 `agent/loans_fallback.py`: `intake_response`; `build_terminal` asks instead of offering when there is no amount and no maximum request.
- [ ] 1.5 Prompt rework: conditional offer mandate ("once you have the amount"), intake instruction, state included.
- [ ] 1.6 Latency: `config.py` + `.env.example` (`LOANS_LLM_DEADLINE_SECONDS=6.5`, `LOANS_INTAKE_DEADLINE_SECONDS=3.5`, `LOANS_MAX_TOKENS=1500`); trim `schedule`/analysis from the prompt; cap history; pass the real fallback reason to the trace/logs.
- [ ] 1.7 Tests: vague turn asks (no terminal); amount persists and never jumps to max; explicit maximum offered; fallback intake; latency defaults; schedule trimmed from the prompt.

## 2. Frontend

- [ ] 2.1 `src/api/endpoints.ts`: raise the loans client timeout to 12s.

## 3. Verification

- [ ] 3.1 Backend: `python3 -m unittest discover -s tests -t .` green.
- [ ] 3.2 `npm run typecheck` clean.
- [ ] 3.3 `npx -y @fission-ai/openspec validate --all` green.
- [ ] 3.4 Manual: "quiero un crédito" → asks for the amount; give an amount → offer at that amount; "dame el máximo" → max offer; the amount survives a term confirmation.
