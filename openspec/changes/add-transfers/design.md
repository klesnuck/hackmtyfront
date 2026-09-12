## Context

No Figma reference exists for this flow. It's specified here purely from the product goal stated when this batch of screens was requested: the app should be interactable "como cualquier app de banco," with interactions reflected in updated data across the generated/fixed interfaces. Transfers are the clearest example of that loop for account-to-account movement (loan payments and savings top-ups cover the domain-specific cases, already scoped in `add-loans-management`/`add-savings-management`).

## Goals / Non-Goals

**Goals:**
- A standard, unsurprising 4-step flow (destination → amount → confirm → result) that a bank-app user already knows how to use.
- Visible, immediate reflection of the transfer's effect on the dashboard balance — this is the point of the exercise (per the request that produced this change: "que estas interacciones terminen reflejadas en datos actualizados en las interfaces que generamos").

**Non-Goals:**
- Does not implement real payment rails, real third-party bank connectivity, or CLABE validation against a real banking network — `SPECS.md` §12 excludes this entirely. CLABE format validation is syntactic only (checksum/length), not a real-bank lookup.
- Does not design a Figma-matched visual for this flow (none exists) — implementation should reuse `mobile/catalog-standard`'s existing components (TextField, Button, Card) and `theme/tokens.ts`, not invent a new visual language.

## Decisions

- **Reuses the standard catalog's form components** rather than building bespoke ones — this flow is fixed app-shell UI (not agent-generated), same category as login/dashboard, so it should look consistent with them using the same building blocks.
- **Balance reflection goes through TanStack Query cache invalidation** (the account/balance query key used by `mobile/dashboard`) rather than a bespoke event-bus — consistent with how server state is already handled elsewhere (`mobile/a2ui-engine`'s design note on keeping server-state and A2UI-surface-state separate; this is server state).

## Risks / Trade-offs

- Depends on `mobile/dashboard`'s balance card existing first (from `add-navigation-and-dashboard`) to have something to reflect the update into — sequence this change after that one.
- No backend contract exists for transfers, own-account listing, or third-party recipient storage — same class of risk as `add-loans-management`/`add-savings-management`; do not start `apply` before backend agreement.
