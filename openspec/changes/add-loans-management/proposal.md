## Why

The Préstamos tab has no screen yet. Figma's "Prestamos Activos" reference (node `37:160`, fileKey `G8zaBTJpiBYqLWtdb3DQ6g`) defines the active-loans list. Beyond that Figma reference, using the app "like any bank app" also requires a way to apply for a new loan manually (not only through the AI assistant's La Mesa flow) — there's no Figma for that yet, so its design is specified here from the product description and the existing loan-card visual language, to be refined against a Figma reference if one is produced later.

## What Changes

- Adds the Préstamos tab's list screen: one card per active loan (name, status, saldo restante, pago mensual, progress bar, next payment date, "Pagar ahora" affordance) — matching Figma exactly.
- Adds a manual loan application flow reachable from the list screen (e.g. an "add" affordance), producing a request the backend can evaluate — independent of the AI assistant's La Mesa negotiation flow, for a user who just wants to apply without a conversation.
- Loan data (list and application) has no corresponding resource in `SPECS.md` §8 yet — this is new backend surface area, not just a client screen. Flagged in `design.md`.

## Capabilities

### New Capabilities
- `mobile/loans`: the Préstamos tab — active loan list and manual loan application.

## Impact

- New route(s) under `app/(tabs)/prestamos.tsx` (list) plus a sub-screen for manual application.
- Requires new backend endpoints (not yet in `SPECS.md` §8) — this proposal specifies the mobile-side behavior and the shape it needs from the backend, but the backend team must independently agree to and implement that contract before this can go live end-to-end. Coordinate before implementation, per `MOBILE_ARCHITECTURE.md` §11.
