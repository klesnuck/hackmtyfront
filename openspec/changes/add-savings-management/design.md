## Context

Figma's "Mis Ahorros" list mixes what look like three different product concepts in one visual pattern: a flexible savings account, a fixed-term investment, and a named goal ("Meta Vacaciones" — which sounds exactly like a Saving Bag per `SPECS.md` §2's secondary pillar). This strongly suggests the Figma design intends ONE unified savings list, but `SPECS.md`'s only savings-related resource is `saving_bags` (REQ-BAG-01..08, goal-based only) — nothing about flexible accounts or term deposits exists in the backend spec today.

## Goals / Non-Goals

**Goals:**
- Ship a visually Figma-accurate list once the backend resource shape is confirmed.
- Not build a second, parallel "savings" concept that fights with Saving Bags — resolve the relationship explicitly (last requirement in the delta spec) rather than guessing.

**Non-Goals:**
- Does not implement flexible-savings or term-deposit backend logic — if the backend team confirms these are in scope beyond Saving Bags, that's their own backend-repo proposal, not this mobile change.

## Decisions

- **Ask, don't assume, whether "Mis Ahorros" = Saving Bags + more, or a superset resource.** This is the single highest-leverage question to resolve before writing any code for this capability — get it wrong and either Saving Bags becomes invisible in this list, or this list duplicates data the backend already models differently.
- **Manual creation mirrors the Saving Bag creation shape where possible** (name, then details) so the two creation paths (assistant-driven, manual) feel like the same underlying action taken two different ways, consistent with `add-loans-management`'s manual/assistant duality decision.

## Risks / Trade-offs

- Same payment/money-movement constraint as `add-loans-management`: "Aportar fondos" must be a simulated flow (`SPECS.md` §12 excludes real payment rails), never real money movement.
- If the backend resource question isn't resolved before `apply`, building this screen risks becoming throwaway work if the real resource shape differs significantly from what's assumed here.
