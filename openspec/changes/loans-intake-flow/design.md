## Context

The loans consultation is a single structured LLM call that may return a terminal
offer. `agent/loans.py::consult` drives it; `agent/loans_fallback.py` provides a
deterministic safety net; `engine/loan_offer.py::propose_offer` derives the amount
(`requested_amount=None` → the maximum affordable). The conversation state lives in
`loan_requests.context_json` and is loaded/saved by `api/routers/loans.py`.

## Goals / Non-Goals

**Goals:**
- Never offer before the amount (and purpose) are known.
- Keep the requested amount across turns; never drift to the maximum.
- Honor an explicit maximum request.
- Make intake feel like a conversation, not a form.

**Non-Goals:**
- Changing the offer math, the term logic, or the A2UI shape.
- A form/UI for intake (it stays conversational).
- Making the maximum unreachable (it stays reachable on request).

## Decisions

**1. Persist `requested_amount`, `purpose`, `use_max` (plus the existing
term/confirmed/purpose_asked) in the loan conversation.** The router already reads
and writes `context_json`; the service computes
`effective_amount = _extract_amount(text) or state.requested_amount`. Without this,
any turn that omits the amount resolves to `max_principal`.

**2. A deterministic intake gate in the backend.** `has_amount = effective_amount
is not None or use_max`. If not `has_amount`, the service returns an intake turn
with `terminal_response = null` and never persists an offer — even if the model
emits a terminal. This makes the "no max jump" guarantee independent of model
behavior. Purpose is asked once (`purpose_asked`) and also gets asked alongside a
term confirmation to avoid an extra round-trip.

**3. The model writes the clarifying question; a deterministic question is the
fallback.** A short intake system prompt forbids a terminal and asks only for what
is missing; if the provider fails/times out, `loans_fallback.intake_response`
produces a natural question. `build_terminal` also guards against fabricating an
offer without an amount.

**4. Explicit maximum is a first-class request.** `_wants_max` recognizes common
phrases so "dame el máximo" reaches the engine maximum deliberately, distinct from
"we didn't understand".

**5. Latency budget is raised and the prompt trimmed.** The 4.0 s / 900-token
budget with a large prompt made DeepSeek time out or truncate and hit the canned
fallback. Raising the deadline to 6.5 s (intake 3.5 s), tokens to 1500, trimming
the per-month `schedule` and the analysis payload from the prompt, capping history,
and extending the client timeout to 12 s keeps the model in the loop while the
deterministic fallback still bounds the worst case.

## Risks / Trade-offs

- **[Risk]** The intake adds a turn before the offer. → It is the point: the user
  is asked what they need instead of being handed the maximum; the amount+purpose
  are asked together where possible.
- **[Risk]** Purpose becomes an extra gate. → It is asked once, and it is bundled
  with the term confirmation when a term is already given.
- **[Risk]** Keyword-based purpose/max/affirmation detection. → It only steers the
  intake vs offer path; anything ambiguous asks rather than offers, so a miss is a
  harmless question, not a wrong offer.
- **[Risk]** A longer LLM deadline delays the response. → Still below the client's
  12 s abort, and the deterministic fallback caps the worst case.
