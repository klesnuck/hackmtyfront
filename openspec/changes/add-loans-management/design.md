## Context

Figma gives an exact visual spec for the list (`37:160`). Manual loan application has no Figma reference and no backend endpoint in `SPECS.md` §8 (which covers session/message/action/ui/saving-bags/negotiation/audio/debug — no generic "loans" CRUD resource). This is genuinely new surface area on both sides, not just a client screen filling in an existing contract.

## Goals / Non-Goals

**Goals:**
- Ship the list screen against real Figma fidelity once a backend list endpoint exists.
- Define the manual-application data shape precisely enough that backend and mobile can agree on it before either side builds against assumptions (`MOBILE_ARCHITECTURE.md` §11's stated risk).

**Non-Goals:**
- Does not decide the backend's underwriting/approval logic — that's the backend/agent's decision (`INV-015`: the client never computes financial math or makes approval decisions).
- Does not duplicate the AI assistant's La Mesa negotiation flow — manual application is a separate, simpler path for a user who doesn't want a conversation. Both paths should converge on the same backend loan resource, not two parallel systems.

## Decisions

- **List and manual-application share one capability (`mobile/loans`)** rather than being split, because they're the same tab and the same backend resource (a loan) viewed two ways: existing (list) and new (apply).
- **Payment flow is deliberately left open** ("defined during implementation") rather than specified now — it depends on what payment mechanism the backend/product decides (`SPECS.md` explicitly excludes real payment rails, so this is necessarily a mocked/simulated flow; the exact UX should be designed once that's confirmed, not guessed here).

## Risks / Trade-offs

- Highest risk item: no backend contract exists yet for loan listing or application. Do not start `apply` on this change until the backend team confirms the response shape (mirror the `api/types.ts` `INFERRED` pattern already used for saving-bags/negotiation in the archived `mobile/a2ui-engine`... this capability will need its own typed client module once confirmed).
- "Pagar ahora" implies a payment mechanism `SPECS.md` §12 explicitly excludes ("Payment rails or real money movement") — this must stay a simulated/mocked flow, never a real money-movement integration, for the hackathon's scope.
