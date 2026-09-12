## Context

Transferencias today (`app/transferir.tsx` → `monto.tsx` → `confirmar.tsx` → `resultado.tsx`, backed by `src/features/transfers/transfer.store.ts`) is a 4-step wizard over a single zustand store seeded entirely from `mockAccounts.ts`/`mockRecipients.ts`. Nothing in that store ever calls `apiRequest` (`src/api/client.ts`). See proposal.md for why this needs to change.

The backend (`amitie/backend`, coordinated in this same session) already established the exact pattern this change needs, for the Préstamos "Abonar" feature: a plain-REST `finance` router (`amitie/backend/api/routers/finance.py`) backed by `finance` MCP tools that do a single deterministic `database.batch()` write (`amitie/backend/mcp_servers/finance/service.py::make_payment`). Real accounts are already served by `GET /api/accounts` and already consumed by `app/(tabs)/inicio.tsx` and `AbonoModal` under the query key `['accounts', userId]`.

## Goals / Non-Goals

**Goals:**
- Replace every hardcoded number/list in Transferencias with data read from (and mutations written to) the real backend, through the same query-key convention already established (`['accounts', userId]`), so a transfer is visible on Inicio immediately.
- Give the screen the two-mode structure the user described, matching real bank-app conventions.
- Define the exact backend contract (request/response shapes) this frontend change codes against, so the backend side (separate repo, documented in its own `SPECS.md`) can be implemented from this document without further back-and-forth.

**Non-Goals:**
- Recipient edit/delete (only create + list). Can follow later if needed.
- Auto-detecting the bank from a CLABE's 3-digit bank-code prefix — the user asked for a "banco" field; a fixed picker (BBVA, Banorte, Santander, Citibanamex, HSBC, Scotiabank, Otro) satisfies that without building a bank-code lookup table.
- Transfer history/statement view — out of scope for this change; the transfer still lands in `transactions` for future use, but no screen surfaces it yet.
- Real payment rails, fraud checks, transfer limits, multi-currency — none of this is a real bank, per `INVARIANTS.md`/`SPECS.md` §12 (external rails), only the internal ledger becomes real.

## Decisions

**Screen structure: one route, a segmented control, not two routes.** `app/transferir.tsx` keeps its single route but renders a two-tab segmented control at the top ("Transferir a otros" / "Transferir entre mis cuentas") instead of the current merged "Mis cuentas" + "Enviar a alguien más" sections. Each tab renders a different picker component, but both funnel into the same existing `monto.tsx` → `confirmar.tsx` → `resultado.tsx` wizard steps (parameterized by a discriminated `TransferDraft`), reusing the review/confirm/result UI rather than duplicating it per mode. Alternative considered: two separate routes under `/transferir/otros` and `/transferir/entre-cuentas` — rejected because it would duplicate the amount/motivo/confirm/result screens for no behavioral difference, and a segmented control is the more direct match for "como la app real de Banorte."

**State split: server data via TanStack Query, in-progress draft via zustand.** Today's store hardcodes `ownDestinations`/`recipients`/`sourceBalance` as store state. This change removes all three from the store: accounts come from `useQuery(['accounts', userId], () => getAccounts(userId))` (already exists), recipients from a new `useQuery(['recipients', userId], () => getRecipients(userId))`. The zustand store (`transfer.store.ts`, rewritten) keeps only the ephemeral, non-persisted draft: selected mode, destination, amount, motivo, submit/result state — the same responsibility split already used for `AbonoModal` (TanStack Query for server truth, component/mutation state for the in-progress action).

**CLABE-only for external recipients, no more bare "account number" fallback.** The existing `validateAccountNumber` (`src/features/transfers/clabe.ts`) accepts 10-17 digit plain account numbers OR an 18-digit checksummed CLABE. Since the new form explicitly asks for "CLABE" (matching the user's spec) plus a separate "banco" field, this change tightens validation to require the full 18-digit, checksum-valid CLABE — the 10-17 digit fallback is dropped along with the field's old ambiguous label. Alternative considered: keep both — rejected, because a real bank-transfer form doesn't accept an unchecksummed plain account number once it also asks which bank it belongs to; that combination isn't a real-world case.

**Backend contract this change codes against** (implemented in `amitie/backend`, documented in that repo's own `SPECS.md` as a contract-note extension, same as the existing `GET /api/accounts|liabilities|profile` and `POST /api/liabilities/{id}/payment`):

- `GET /api/recipients?user_id=` → `{ recipients: [{ id, alias, clabe, bankName, createdAt }] }`
- `POST /api/recipients` body `{ user_id, alias, clabe, bank_name }` → the created recipient, same shape as above; the backend re-validates the CLABE checksum server-side (never trust client-only validation for a money-adjacent field).
- `POST /api/transfers` body:
  ```json
  {
    "user_id": "u_ana",
    "source_account_id": "a_ana_nom",
    "amount": 500.0,
    "memo": "Renta de septiembre",
    "destination": { "kind": "own", "account_id": "a_ana_ahorro" }
  }
  ```
  or, for an external recipient:
  ```json
  {
    "user_id": "u_ana",
    "source_account_id": "a_ana_nom",
    "amount": 500.0,
    "memo": "Renta de septiembre",
    "destination": { "kind": "external", "clabe": "...", "bank_name": "BBVA", "alias": "Mamá", "save_recipient": true }
  }
  ```
  → `{ status: "ok" | "error", transfer, source_account, destination_account?, issues: [] }`, mirroring the shape and status/issues convention already used by `PaymentResponse` for Abonar, so the frontend's existing `ApiError`/`issues`-rendering pattern in `AbonoModal` can be copied directly rather than inventing a new error-handling shape.

**Query invalidation on success:** the transfer mutation invalidates `['accounts', userId]` (both `AbonoModal` and Inicio already read this key, so both the source and, for an own-account transfer, the destination account refresh immediately — satisfying "reflected everywhere" without a dedicated event bus) and `['recipients', userId]` when a new recipient was saved.

## Risks / Trade-offs

- **[Risk]** The backend endpoints this design depends on don't exist yet (as of this proposal, only `accounts`/`liabilities`/`profile`/the payment endpoint exist). → **Mitigation**: same sequencing as the Abonar feature — implement and test the backend endpoints first (against the real seeded SQLite DB, with unit tests), confirm they work with `curl`, then wire the frontend against the confirmed real contract, exactly as done for Abonar in the previous pass.
- **[Risk]** Tightening CLABE validation to 18-digit-only could reject a real test value someone has memorized as a shorter "account number." → **Mitigation**: the empty-state/new-recipient form's inline error message explains the 18-digit CLABE requirement plainly; this is a hackathon demo app with seeded/fake CLABEs anyway, not a real bank integration.
- **[Risk]** Removing the old `add-transfers` openspec change's "simulated, never real" requirement is a real reversal of a previously written spec. → **Mitigation**: called out explicitly as a REMOVED requirement with reason/migration in this change's delta spec, and the old change is flagged for archival in the proposal's Impact section rather than silently left inconsistent.

## Migration Plan

1. Backend: add `saved_recipients` table + `transactions.memo` column (idempotent migration, same pattern as the existing `generated_ui.frozen_json` migration), the three new `finance` MCP tools, the three new REST endpoints, and unit tests — verified against the real local SQLite DB before any frontend change lands (mirrors how Abonar was verified end-to-end with `curl` before being called "done").
2. Frontend: add the new API types/endpoints, rewrite `transfer.store.ts` and the four transfer screens, delete the mock files. No feature flag — this is a hackathon demo app with one active branch, and the old flow has no persisted state worth preserving through a gradual rollout.
3. Archive/delete the stale `openspec/changes/add-transfers` change once this one is applied, since it now conflicts with the merged `mobile/transfers` spec.

Rollback, if needed, is a plain `git revert` on both repos plus `python -m db.init` to re-seed the backend's local SQLite file — there is no real user data at risk (seeded/mocked personas only).
