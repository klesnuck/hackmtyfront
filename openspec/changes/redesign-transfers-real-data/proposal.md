## Why

The Transferencias panel is currently 100% hardcoded: `src/features/transfers/mockAccounts.ts` fixes the source balance at `$18,452.30` regardless of the real account (`GET /api/accounts` already returns Ana's real BBVA balance, used correctly by Inicio and Préstamos since the previous session's backend-wiring pass), `mockRecipients.ts` fixes two fake saved contacts, and `transfer.store.ts` "submits" a transfer with a `setTimeout` and a random decline rate — nothing is persisted, and a successful transfer doesn't even touch the number Inicio shows. The user asked for this panel to look and behave like a real bank app (Banorte-style): a "transfer to others" flow with saved recipients (CLABE + alias) and a "transfer between my accounts" flow with two account pickers, both backed by real, persisted backend data instead of card-shaped decoration.

## What Changes

- **BREAKING**: Removes the current single-screen destination picker (`app/transferir.tsx`'s combined "Mis cuentas" + "Enviar a alguien más" list) and its backing mock files (`src/features/transfers/mockAccounts.ts`, `mockRecipients.ts`), the simulated `transfer.store.ts` submit logic, and the old unimplemented `openspec/changes/add-transfers` proposal (superseded by this one — recommend archiving/deleting it once this change applies, since its spec explicitly assumed "transfers are simulated, never real money movement," which this change reverses).
- Restructures the Transferencias screen into two tabs (segmented control), matching the user's explicit product direction:
  - **"Transferir a otros"**: a "Transferir a nuevo destinatario +" entry (CLABE, banco, alias, and a "guardar" toggle) plus a "Mis destinatarios" list of previously saved recipients (alias + masked CLABE), fetched from a new backend endpoint.
  - **"Transferir entre mis cuentas"**: side-by-side/stacked origin and destination account pickers populated from the user's real `GET /api/accounts`, excluding the same account from both sides.
- Adds a required **motivo** (memo/concept) field to the amount-entry step for both flows — it doesn't exist today.
- Wires the confirm step to a real backend transfer endpoint (new; specified in this change but implemented in the separate `amitie/backend` repo) instead of the client-side random-decline simulation. A successful transfer actually debits the source account and, for an own-account destination, credits the destination account — both real, persisted, and immediately reflected by Inicio's balance card and this screen without an app restart.
- External (CLABE) transfers debit the source account only (no matching account exists in this system for an outside bank) and are rejected by the backend, not just the client, on insufficient funds or an invalid CLABE checksum.

## Capabilities

### New Capabilities
- `mobile/transfers`: the transfer-money flow (own accounts and third party via saved/new recipients), now specified against real backend data. (No spec was ever merged from the earlier `add-transfers` change — it stayed an unapplied proposal — so this is written as a fresh capability spec that fully replaces that intent.)

### Modified Capabilities
_None — `mobile/dashboard`, `mobile/loans`, etc. are unaffected by this change beyond consuming the same already-existing `GET /api/accounts` query key (`['accounts', userId]`) they already invalidate/read today._

## Impact

- Frontend: `app/transferir.tsx` (rewritten with a tab/segmented layout), `app/transferir/monto.tsx` (add motivo field), `app/transferir/confirmar.tsx` and `app/transferir/resultado.tsx` (call the real endpoint, render real response), `src/features/transfers/*` (types, store, and mock files replaced by a real API-backed store), `src/api/types.ts` / `src/api/endpoints.ts` (new `Recipient`/`Transfer` types and calls).
- Backend (`amitie/backend`, separate repo — coordinated in this same session, documented in its own `SPECS.md`): new `saved_recipients` table, a `memo` column on `transactions`, new `finance` MCP tools (`list_recipients`, `create_recipient`, `transfer_funds`) and new REST endpoints (`GET/POST /api/recipients`, `POST /api/transfers`), following the exact pattern already established by `POST /api/liabilities/{id}/payment` ("Abonar").
- No change to `INV-030`'s hard-cut-line pillars (La Mesa/El Revés, Saving Bags, accessibility) — this is a native-screen realism improvement the user explicitly requested, not a demo-critical feature, and should not consume time at the expense of those pillars if they're still in progress on the backend side.
