# add-transfers

Transfer money between own accounts or to a third party

## Validation note (2026-09-12)

Validated independently (fresh read, not the executor). No Figma reference exists for
this lane (per `proposal.md`), so validation was against this change's own
`proposal.md` / `design.md` / `specs/mobile/transfers/spec.md` and the cross-lane
route contract in `openspec/WORKFLOW.md`.

**Checked and confirmed:**
- All expected files exist and are complete (no TODOs/stubs):
  `src/features/transfers/{types,transfer.store,mockAccounts,mockRecipients,clabe,format}.ts`,
  `src/features/transfers/components/{TransferHeader,DestinationRow,SummaryRow}.tsx`,
  `app/transferir.tsx`, `app/transferir/{monto,confirmar,resultado}.tsx`.
- No backend calls anywhere in this lane — grepped for `apiRequest`, `fetch(`, and
  `src/api/` imports across all of the above: zero matches. Fully local/mocked, per
  scope.
- Cross-lane contract holds: `app/(tabs)/inicio.tsx`'s "Transferir" quick action
  calls `router.push('/transferir')` (grepped directly).
- CLABE/account-number validation (`clabe.ts`, mod-10 checksum on 18-digit CLABEs,
  10-17 digit plain account numbers otherwise) is wired into `app/transferir.tsx`'s
  third-party form with live per-keystroke feedback (`validateAccountNumber` re-run
  on every change, inline error shown once the field is non-empty and invalid).
- Full flow walkthrough (read, not device-run — none attached):
  destination (`app/transferir.tsx`) → amount (`monto.tsx`) → confirm
  (`confirmar.tsx`) → submit (`transfer.store.ts#submitTransfer`) → result
  (`resultado.tsx`). Each of `monto.tsx`, `confirmar.tsx`, `resultado.tsx` has a
  real `useEffect` guard that `router.replace('/transferir')`s when its required
  upstream state (`destination`, `amount`, `result` respectively) is missing —
  not just documented, actually implemented and gates the screen's render (`if
  (!x) return null` before the guard's replace takes effect).
- **Both result paths are genuinely reachable**, not just theoretically possible:
  `submitTransfer` has a `SIMULATED_DECLINE_RATE = 0.25` random-failure branch
  that fires independently of the amount, so failure is reachable even with a
  fully valid, affordable transfer (confirmed by reading the store; this is also
  called out in the store's own comment). Insufficient-funds is a second failure
  branch in the store, though in normal use the amount step's own inline
  validation (`parsedAmount > sourceBalance` disables Continue) prevents ever
  submitting an amount that would trigger it — so the decline-rate branch is the
  one that actually exercises the failure result screen in practice. The result
  screen's "Reintentar" button routes back to `confirmar.tsx` without resetting
  `destination`/`amount`, so a user can retry until they land on success.
- `npm run typecheck` and `npm run lint`: clean, repo-wide (not just this lane's
  files) — no lingering errors anywhere, including the previously-fixed
  `/dashboard` reference in `app/login.tsx` (confirmed gone).

**Known, intentional gap (flagged, not fixed — cross-lane, out of this lane's file
ownership):** the spec's "Result state and balance reflection" requirement says a
successful transfer should update "the source account's balance everywhere it's
displayed (e.g. the dashboard balance card)". This lane's `sourceBalance` in
`transfer.store.ts` does correctly decrement on success and persists for the rest
of the session (no restart needed) — but it is a self-contained mock balance
(`mockAccounts.ts`'s own comment says as much), never wired to
`src/features/dashboard/mockAccount.ts` or a TanStack Query cache invalidation as
`design.md` envisioned. That wiring would require touching lane A's dashboard
files, which this lane doesn't own. Left as a documented follow-up, matching the
executor's own code comment.

**Tasks checked off:** §2 (2.1, 2.2), §3 (3.1, 3.2), §4.1 — all genuinely built and
verified by reading. Left unchecked:
- §1 (Backend coordination) — correctly out of scope for this pass.
- §4.2 (dashboard balance query invalidation) — not implemented; see gap above.
- §5.1 — `npm run typecheck` / `npm run lint` are clean, but `npm run doctor`
  reports one failed check repo-wide ("Multiple lock files detected:
  pnpm-lock.yaml, package-lock.json") — pre-existing, unrelated to this lane, and
  outside this lane's file ownership to fix, so 5.1 is left unchecked as a whole
  rather than partially claimed.
- §5.2 — depends on the dashboard-wiring gap above; not actually observable since
  the wiring doesn't exist yet.
- §5.3 — the underlying logic was confirmed correct by reading the code (see
  flow walkthrough above), but this item asks to "confirm" runtime behavior,
  which needs a running device/simulator; none is attached in this environment,
  so left unchecked rather than checked off on static reading alone.

No files were modified outside `tasks.md` and this `README.md` — no bugs were found
that required a fix.
