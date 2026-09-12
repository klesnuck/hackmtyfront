# add-savings-management

Savings/apartados list and manual savings creation, matching Figma's Mis Ahorros

## Validation note (2026-09-12)

Validated independently (fresh review, not the executor) against
`openspec/WORKFLOW.md`'s validator role and this change's `proposal.md` /
`design.md` / `specs/mobile/savings/spec.md` / `tasks.md`.

**Files checked**: `app/(tabs)/apartados.tsx`, `src/features/savings/SavingsCard.tsx`,
`src/features/savings/mockSavings.ts`. All three exist, are complete, and are
free of real backend calls — grepped for `apiRequest`, `fetch(`, and any
`src/api/*` import across all three files: no matches. `src/api/types.ts` and
`src/api/endpoints.ts` were not touched. `src/features/saving-bags/` (the AI
assistant's separate Saving Bags capability) is empty/untouched — confirmed
no cross-contamination between the two features, consistent with `design.md`'s
explicit note that the relationship between them is still unresolved.

**Figma comparison** (`get_screenshot` + `get_design_context` on node `37:266`,
fileKey `G8zaBTJpiBYqLWtdb3DQ6g`, pulled live by this validator): the built
list screen is an exact structural and near-exact visual match — header bar
(`Mis apartados`, `#EC0029`/`colors.brand.primary`, 56px height, bell icon),
each card (name, green growth badge with up-arrow, "Saldo de ahorro" label,
balance + "MXN", divider, "Rendimiento anual: X% GAT" in green, "Aportar
fondos" in brand red), and even the three mock vehicles' names/balances/yields
match Figma's sample data exactly (Ahorro Flexible $28,450.00, Inversión a
Plazo Fijo $15,000.00, Meta Vacaciones $1,780.50). Colors `#34C759` (growth
green) and `#EAF9EE` (badge background) are not yet in `src/theme/tokens.ts`;
the code notes this and keeps them as a local `accent` object pending
promotion — an acceptable, explicitly-flagged deviation per the validator
brief, not a structural failure. One minor, non-blocking deviation: Figma's
balance amount renders at 24px/extrabold, the build uses the existing
`typography.h2` token (22px/bold) rather than introducing a one-off size —
reasonable given the "tokens.ts is the only source of type scale" convention.
The bottom tab bar visible in the Figma frame is lane A's file
(`app/(tabs)/_layout.tsx`), out of this lane's ownership, so not evaluated
here.

**Verification commands**: `npm run typecheck` and `npm run lint` both ran
clean with no output (no errors from these three files or anywhere else in
the repo at time of this validation).

**Tasks checked off**: §2 (List screen) 2.1–2.3, §3 (Manual creation)
3.1–3.3, §4 (Aportar fondos) 4.1–4.2 (simulated locally per `SPECS.md` §12),
and §5 (Verification) 5.1 (typecheck/lint only — `doctor` and the device
screenshot step were not run, no simulator attached in this environment) and
5.2 (screenshot comparison, done above).

**Left unchecked, and why**: all of §1 "Backend coordination" — no backend
contact happened in this pass, matching `openspec/WORKFLOW.md`'s scope
(interfaces + mocked data only, no backend integration this pass). Task 2.4
("visual distinction if backend confirms separate resources") stays
unchecked because it's gated on §1 being resolved first. `npm run doctor`
under 5.1 was not run by this validator — it's an environment/build-health
check outside a single lane's UI-correctness scope and no device/simulator
is attached here.

No code changes were needed — no bugs found in the three files.
