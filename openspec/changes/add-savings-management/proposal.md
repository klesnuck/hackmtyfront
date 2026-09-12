## Why

The Apartados tab has no screen yet. Figma's "Mis Ahorros" reference (node `37:266`, fileKey `G8zaBTJpiBYqLWtdb3DQ6g`) defines the savings/apartados list. Using the app like a real bank app also requires creating a new savings goal or apartado manually, not only through the AI assistant's Saving Bags flow — there's no Figma for that yet, specified here from the product description.

Note: this is a **separate capability from the AI assistant's "Saving Bags"** (`SPECS.md` §2's secondary pillar, driven entirely by agent conversation — REQ-BAG-*). Figma's "apartados" list is a more general account-level view of savings vehicles (flexible savings, term deposits, goal-based ones) that may include Saving Bags created via the assistant alongside manually created ones. The exact relationship between the two needs backend confirmation (see `design.md`).

## What Changes

- Adds the Apartados tab's list screen: one card per savings vehicle (name, monthly growth badge, balance, annual yield, "Aportar fondos" affordance) — matching Figma exactly.
- Adds a manual savings/apartado creation flow reachable from the list screen, independent of the assistant's Saving Bags conversation.

## Capabilities

### New Capabilities
- `mobile/savings`: the Apartados tab — savings list and manual creation.

## Impact

- New route(s) under `app/(tabs)/apartados.tsx` (list) plus a sub-screen for manual creation.
- Requires backend coordination on whether this list is the same resource as `SPECS.md`'s `saving_bags` (REQ-BAG-*, REQ-API-05) or a broader "savings vehicles" resource that includes them — must be resolved before implementation, not assumed.
