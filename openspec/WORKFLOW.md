# Multi-Agent Build Workflow — Executor / Validator

This document describes how the pending mobile-frontend interface changes in
`openspec/changes/` get **built** (not proposed — they're already approved
proposals) in this pass. It is a process doc, not a capability spec; it does
not get archived into `openspec/specs/`.

## Scope of this pass

**Interfaces only — no backend integration, no business logic beyond local
navigation and component state.** Every screen renders against mocked/local
data. Tasks in each change's `tasks.md` that require a live backend contract
(marked "Backend coordination (blocking)", or submission/payment logic that
would need a real endpoint) are explicitly **out of scope** and stay
unchecked. Tasks that are pure UI construction, navigation wiring, or
mock-data plumbing are in scope and get checked off (`[x]`) once built and
validated.

Figma source for every node referenced below: fileKey `G8zaBTJpiBYqLWtdb3DQ6g`.

## Roles

- **Executor** — builds one lane's files from its change's `proposal.md` /
  `design.md` / `tasks.md`, following this repo's conventions (`AGENTS.md` §6
  code style, `src/theme/tokens.ts` as the only source of colors/spacing/type,
  no third-party UI kits, no comments beyond non-obvious *why*). Writes code
  only; does not mark tasks done.
- **Validator** — runs after its lane's executor, independently. Pulls the
  Figma node for that screen live (`get_design_context` / `get_screenshot` on
  the node id below) and checks the implementation against it (structure,
  colors, spacing, copy) and against the change's own acceptance scenarios in
  `specs/*/spec.md`. Then, and only then, checks off the specific `tasks.md`
  items that are true, and leaves a short note in the change's `README.md` (or
  adds one) listing any deviation from Figma and why, or any task
  deliberately left unchecked and why (e.g. "needs backend contract").

Executor and validator are separate agent invocations (fresh context) so the
validator isn't grading its own work.

## Lanes (parallel — disjoint file ownership)

No two lanes write the same file, so all six run concurrently. Two small
cross-lane contracts (route path strings) are fixed below so lanes don't need
to coordinate live.

| Lane | Change | Figma node | Owns (new/moved files) |
|---|---|---|---|
| A | `add-navigation-and-dashboard` | `37:42` | `app/(tabs)/_layout.tsx`, `app/(tabs)/inicio.tsx`, `app/asistente-prestamos.tsx` (content moved from current `app/dashboard.tsx`), `src/features/dashboard/mockAccount.ts`, edits `app/index.tsx` redirect only. Deletes `app/dashboard.tsx` after moving its content out. **Does not touch** `app/assistant.tsx`. |
| B | `add-assistant-orb-screen` | `37:123` | Moves `app/assistant.tsx` → `app/(tabs)/asistente.tsx`, adds `src/features/assistant-orb/AnimatedOrb.tsx`. |
| C | `add-error-screen` | `37:351` | `src/catalog/shared/ErrorScreen.tsx`, error code registry (e.g. `src/catalog/shared/errorCodes.ts`). No adoption/wiring into real failure paths this pass (that's business logic). |
| D | `add-loans-management` | `37:160` | `app/(tabs)/prestamos.tsx`, `src/features/loans/LoanCard.tsx`, `src/features/loans/mockLoans.ts`. List + empty state + a non-submitting "Solicitar préstamo" form UI. No API wiring. |
| E | `add-savings-management` | `37:266` | `app/(tabs)/apartados.tsx`, `src/features/savings/SavingsCard.tsx`, `src/features/savings/mockSavings.ts`. List + empty state + a non-submitting creation form UI. No API wiring. |
| F | `add-transfers` | none (spec'd from scratch, see change's `design.md`) | `app/transferir.tsx` (+ nested steps if needed under `app/transferir/`), `src/features/transfers/*` mock data/components. Destination → amount → review → result, all local state. |

**Fixed cross-lane route contracts** (so lanes don't need to wait on each
other to agree at runtime):
- The assistant screen's final route is `/asistente` (not `/assistant`) —
  lane B owns the rename; lane A's `app/asistente-prestamos.tsx` pushes to
  `/asistente` with its existing `intent` param (`la-mesa` / `saving-bags`),
  unchanged from today's `app/dashboard.tsx` behavior.
- Lane A's Inicio dashboard wires: the dark "Asistente de Préstamos IA"
  banner → `router.push('/asistente-prestamos')` (see decision below); quick
  actions Ahorros → `/apartados`, Préstamos → `/prestamos`, Transferir →
  `/transferir`. Route groups (`(tabs)`) don't affect the URL, so these paths
  resolve regardless of which lane finishes first.

## Decision: repurposing the current `app/dashboard.tsx`

The current `app/dashboard.tsx` is not a generic dashboard — it's already an
intermediate routing panel: two cards (La Mesa / Saving Bags) that each push
to the assistant with a specific `intent`, plus a general "Habla con tu
asistente" CTA. That role doesn't change. What changes is *how it's reached*:
instead of being the post-login landing screen, it becomes the destination of
the new Figma dashboard's "Asistente de Préstamos IA" banner (confirmed with
the user 2026-09-12 — the banner was originally speced to route straight to
the Soporte IA tab; it now routes here first, since this screen's whole job
is figuring out which specific thing the user wants before handing off to the
agent with that intent already attached).

Mechanically: content moves to `app/asistente-prestamos.tsx`, pushed
(non-tab, stack) from Inicio so the tab bar hides while it's open, matching
how the assistant chat screen already behaves. A back chevron is added since
it's no longer a tab root. No visual redesign — it already uses
`theme/tokens.ts` exclusively; the only style adjustment is the added header
with the back affordance, consistent with the rest of the app's pushed
screens.

This is reflected in `add-navigation-and-dashboard`'s `proposal.md` /
`design.md` / `tasks.md`.

## Verification (each validator runs before checking any task)

- `npm run typecheck`, `npm run lint` clean for the files it touched.
- Screenshot/design-context comparison against the Figma node above (where
  one exists).
- Confirm the change's own `specs/*/spec.md` scenarios are satisfiable by
  what was built (mocked data standing in for real data is fine; the
  *shape* of the interaction must match).
- Confirm no lane wrote outside its file ownership table above.

## After all six lanes land

A short integration pass (not a lane — done once, after) confirms the five
cross-lane route strings above actually resolve (grep, not a device run,
since no simulator is attached in this environment) and that
`app/index.tsx` redirects to `/inicio` post-login. `openspec archive` is a
separate, later, human-approved step — this pass only builds and checks off
`tasks.md`, it does not archive changes.
