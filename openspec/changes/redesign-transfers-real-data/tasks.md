## 1. Backend (`amitie/backend`, separate repo — implement and verify first)

- [x] 1.1 Add `saved_recipients` table to `db/schema.sql` (`id, user_id, alias, clabe, bank_name, created_at`) + index on `user_id`.
- [x] 1.2 Add an idempotent `transactions.memo` column migration in `db/schema.py::_ensure_columns` (same pattern as the existing `frozen_json`/`username`/`password_hash` migrations), and add `memo TEXT` to the `transactions` table definition in `schema.sql` for fresh installs.
- [x] 1.3 Add a Python CLABE checksum validator (mirrors `src/features/transfers/clabe.ts`'s mod-10/weights-3-7-1 algorithm) — server-side re-validation, never trust the client alone.
- [x] 1.4 `mcp_servers/finance/service.py`: add `list_recipients(database, user_id)`, `create_recipient(database, user_id, alias, clabe, bank_name)`.
- [x] 1.5 `mcp_servers/finance/service.py`: add `transfer_funds(database, user_id, source_account_id, amount, memo, destination)` — validates source account ownership/balance; for `destination.kind == "own"` validates the destination account belongs to the same user and differs from source, then in one `database.batch()` debits source, credits destination, and inserts two `transactions` rows (`category='transfer_own'`); for `destination.kind == "external"` validates the CLABE checksum, debits source only, inserts one `transactions` row (`category='transfer_external'`), and if `save_recipient` is set, also inserts into `saved_recipients`.
- [x] 1.6 `mcp_servers/finance/server.py`: register `list_recipients`, `create_recipient`, `transfer_funds` as MCP tools.
- [x] 1.7 `api/schemas.py`: add `RecipientCreateRequest`, `RecipientResponse`, `RecipientsResponse`, `TransferDestination` (own/external variants), `TransferRequest`, `TransferResponse` (mirroring `PaymentResponse`'s status/issues convention).
- [x] 1.8 `api/routers/finance.py`: add `GET /api/recipients`, `POST /api/recipients`, `POST /api/transfers`.
- [x] 1.9 Tests: recipients list/create, transfer between own accounts (balances move, both `transactions` rows recorded), external transfer (only source debited, recipient optionally saved), insufficient funds rejected, invalid CLABE rejected, same-account-both-sides rejected.
- [x] 1.10 Run the full suite, then start the server and `curl` every new endpoint against the real seeded DB (same verification style as the Abonar/login work), then re-seed to restore clean state. (See report: verified against an isolated seeded copy, not the shared `data/amitie.sqlite3`, because another uvicorn instance was already running against that shared file for unrelated in-progress work.)
- [x] 1.11 Update `amitie/SPECS.md` with a contract note (or numbered `REQ-XFER-*` entries) for the new endpoints, and a `CHANGELOG.md` entry.

## 2. Frontend types & API layer

- [x] 2.1 `src/api/types.ts`: add `Recipient`, `RecipientsResponse`, `TransferDestination`, `TransferRequest`, `TransferResponse`.
- [x] 2.2 `src/api/endpoints.ts`: add `getRecipients(userId)`, `createRecipient(request)`, `submitTransfer(request)`.

## 3. Rewrite the transfer store and mock data removal

- [x] 3.1 Delete `src/features/transfers/mockAccounts.ts` and `mockRecipients.ts`.
- [x] 3.2 Rewrite `src/features/transfers/transfer.store.ts` to hold only the ephemeral draft (mode, destination, amount, motivo, submit/result state) — no more hardcoded `ownDestinations`/`recipients`/`sourceBalance`.
- [x] 3.3 Tighten `src/features/transfers/clabe.ts` to require the full 18-digit checksummed CLABE (drop the 10-17 digit plain-account-number fallback), matching the new form's explicit "CLABE" + "banco" fields.
- [x] 3.4 Add a small fixed bank picker list (BBVA, Banorte, Santander, Citibanamex, HSBC, Scotiabank, Otro) for the "banco" field.

## 4. Screens

- [x] 4.1 `app/transferir.tsx`: replace the merged "Mis cuentas"/"Enviar a alguien más" sections with a two-tab segmented control ("Transferir a otros" / "Transferir entre mis cuentas").
- [x] 4.2 Build the "Transferir a otros" tab: "Transferir a nuevo destinatario +" entry (CLABE, banco picker, alias, "guardar" toggle) backed by `useQuery(['recipients', userId], ...)`, and a "Mis destinatarios" list with an empty state.
- [x] 4.3 Build the "Transferir entre mis cuentas" tab: origin/destination account pickers from `useQuery(['accounts', userId], ...)` (already used by Inicio/AbonoModal), same-account selection prevented, and a "need a second account" empty state.
- [x] 4.4 `app/transferir/monto.tsx`: add the required motivo field alongside amount; keep the balance-validation behavior, sourced from the real selected origin account instead of the store's old hardcoded `sourceBalance`.
- [x] 4.5 `app/transferir/confirmar.tsx`: show motivo in the review card; replace `submitTransfer()`'s client-side simulation with a real mutation calling `submitTransfer()` (the new API function), invalidating `['accounts', userId]` (and `['recipients', userId]` if a recipient was saved) on success — same pattern as `AbonoModal`.
- [x] 4.6 `app/transferir/resultado.tsx`: render the real backend response (including a real failure reason from `issues`/`ApiError`, not the old random-decline copy).

## 5. Verification

- [x] 5.1 `npm run typecheck` and `eslint` clean on every changed file. (Full-repo run: 0 typecheck errors; lint has 5 pre-existing warnings in unrelated files `apartados.tsx`/`asistente.tsx`, none in files touched by this change.)
- [x] 5.2 SKIPPED (documented, not executed): manually exercising both tabs against the real running backend requires a running Expo app/device/simulator, which is not available in this environment. In its place: (a) the backend contract itself was exercised end-to-end via `curl` in task 1.10 (own-account transfer, external transfer with `save_recipient`, insufficient funds, invalid CLABE, same-account-both-sides — all behaving per design.md's contract), and (b) a careful manual code self-review of the frontend data flow (store wiring, query-key invalidation targets, the discriminated-union mapping in `confirmar.tsx::toApiDestination` against the backend's `TransferRequest` schema, hook-ordering, and guard conditions across all 4 screens), backed by a clean `tsc --noEmit` and zero ESLint issues on every changed file.

## 6. Cleanup

- [x] 6.1 DELETED (not archived) the stale `openspec/changes/add-transfers` directory. `openspec archive` merges a change's delta spec into main specs, which is right for completed/correct work — but `add-transfers` was never implemented, and its one requirement ("Transfers are simulated, never real money movement") is now factually wrong, explicitly reversed by this change's own REMOVED-requirement entry. Archiving it would have merged that stale requirement into `openspec/specs/`; deleting was the correct action per proposal.md's Impact section and design.md's Migration Plan step 3.
