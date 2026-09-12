## Why

The dashboard's "Transferir" quick action (Figma node `37:42`) has no destination screen. No Figma reference exists for a transfer flow specifically — this proposal specifies it from the product description ("interactuar con la aplicación como cualquier app de banco") and standard bank-transfer UX, to be refined against a Figma reference if one is produced later.

## What Changes

- Adds a transfer flow: choose destination (own account vs. a third party by CLABE/account number), enter amount, review/confirm, see result — reachable from the dashboard's "Transferir" quick action.
- Transfers are simulated, never real money movement (`SPECS.md` §12 explicitly excludes payment rails) — this is a UI/UX flow against mocked backend state, demonstrating the interaction loop, not a real funds-transfer integration.
- On success, updates the relevant account balance(s) shown elsewhere in the app (dashboard balance card) so the interaction visibly "reflects in updated data," per the product goal driving this whole batch of screens.

## Capabilities

### New Capabilities
- `mobile/transfers`: the transfer-money flow (own accounts and third party).

## Impact

- New route(s) reachable from the dashboard quick action.
- Requires backend coordination: no transfer resource exists in `SPECS.md` §8. This proposal specifies the mobile-side flow and the data shape it needs; the backend team must agree before implementation.
- Interacts with `mobile/dashboard`'s balance card (must reflect a transfer's effect) and potentially `mobile/loans` (a transfer could be "pay this loan," already covered by that capability's "Pagar ahora" — this capability is for account-to-account/third-party transfers specifically, not loan payments, to avoid overlap).
