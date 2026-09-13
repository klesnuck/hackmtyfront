# add-navigation-and-dashboard

Bottom tab navigation and a Figma-accurate home dashboard (account balance, AI banner, quick actions)

## Validation note (2026-09-12)

Independent validator pass (fresh context, no executor self-report available —
the executor was cut off by a rate limit before it could report). Verified
from scratch: read every lane-A file in full, pulled Figma node `37:42`
(fileKey `G8zaBTJpiBYqLWtdb3DQ6g`) live via `get_design_context` +
`get_screenshot`, and ran `npm run typecheck` / `npm run lint` / `npm run
doctor`.

**Verdict: pass**, with the deviations and gaps below noted rather than
silently checked off.

### File ownership / structure
- `app/(tabs)/_layout.tsx`, `app/(tabs)/inicio.tsx`, `app/asistente-prestamos.tsx`,
  `src/features/dashboard/mockAccount.ts`, `app/index.tsx` all present and match
  their described roles.
- `app/dashboard.tsx` no longer exists (confirmed via directory listing).
- `app/assistant.tsx` no longer exists at the root; `app/(tabs)/asistente.tsx`
  exists in its place. This is lane B's file per `WORKFLOW.md`'s ownership
  table — confirmed only that the move happened at the filesystem level, did
  not review its content.
- `app/asistente-prestamos.tsx` faithfully preserves the original La
  Mesa/Saving Bags picker: two cards push to `/asistente` with
  `intent: 'la-mesa'` / `intent: 'saving-bags'`, plus the general "Habla con
  tu asistente" CTA also pushing to `/asistente`. A back-chevron header
  (`chevron-back` + `router.back()`) was added as required. No stray
  `/assistant` (old path) references remain in this file.
- Route-string contracts all check out exactly: banner → `/asistente-prestamos`
  (not the Soporte IA tab); quick actions → `/apartados`, `/prestamos`,
  `/transferir`.

### Figma comparison (node 37:42)
Structurally complete — every element in the Figma reference is present:
red header (greeting + avatar initials + bell), dark AI banner with glow
decoration, white balance card (bank name, masked account number, balance,
CLABE + copy affordance), and the 3-icon quick-actions row. No missing
elements found.

Colors: header red, banner near-black, and all three quick-action tint
colors (`#00C7BE` savings teal, `#EC0029` brand red, `#007AFF` transfer blue)
are exact hex/RGB matches to the Figma node, including the ~10% opacity icon
circle backgrounds. Tab bar active/inactive colors also match exactly
(`colors.brand.primary` / `colors.text.secondary`).

Minor, acceptable near-misses (all traced to the nearest existing
`theme/tokens.ts` typography token rather than a new literal size):
- Greeting name: Figma 20px bold → built uses `typography.h3` (18px bold).
- Avatar initials: Figma 16px bold → built uses `typography.bodyStrong` (15px).
- Balance card bank name: Figma 14px semibold → built uses `typography.bodyStrong` (15px).
- Balance currency suffix ("MXN"): Figma 16px semibold → built uses `typography.bodyStrong` (15px).
- "Operaciones rápidas" section title: Figma 16px bold → built uses `typography.h3` (18px).

These are genuine (if small) type-scale deviations, not structural gaps —
acceptable per the validator brief since no 14/16/20px bold token exists in
`theme/tokens.ts` today.

One copy deviation worth flagging explicitly: Figma's own node text reads
"Asistente de Préstamos" (English acronym), but `proposal.md`,
`design.md`, and `tasks.md` (§3.1) all quote the banner title as "Asistente
de Préstamos **IA**" (Spanish). The built code follows the written spec
("IA"), not the literal Figma string. Treating this as intentional — the
three planning docs agree with each other and disagree with Figma
consistently, which reads as a deliberate correction of a Figma copy typo —
but flagging it here in case that assumption is wrong.

Icon substitutions: Figma's custom SVGs (piggy-bank, banknote) don't have
exact Ionicons equivalents; the build uses `save`/`save-outline` and
`cash`/`cash-outline` respectively. Consistent with `design.md`'s decision to
reuse Ionicons rather than add a second icon set — acceptable.

### Spec drift found (not fixed — outside file-edit permission for this pass)
`specs/mobile/dashboard/spec.md`'s "AI banner" requirement and its "Tapping
the AI banner" scenario still say the banner "navigates to the Soporte IA
tab" — this is the **pre-repurposing** behavior. `design.md`'s "Repurposing
decision (2026-09-12)" and `tasks.md` §3.2 both explicitly supersede this
(banner → `/asistente-prestamos`), and the built code correctly follows the
newer decision, not the stale spec text. `spec.md` itself was never updated
to match. This validator was scoped to `tasks.md` + `README.md` only, so
`spec.md` was left as-is — someone should reconcile it before archiving this
change.

### Bug found outside lane A's ownership (not fixed)
`app/login.tsx:41` still calls `router.replace('/dashboard')` on successful
login — a dangling reference to the route lane A deleted. This surfaces as
one of the two `npm run typecheck` errors. `app/login.tsx` is not in lane
A's file-ownership list (per `WORKFLOW.md`'s lane table) and wasn't in this
validator's read/touch list, so it was deliberately left unfixed. This
should be caught in the post-integration pass described in `WORKFLOW.md`
("After all six lanes land") — currently nothing in that plan's fixed
cross-lane contracts covers `login.tsx`'s redirect target.

### typecheck / lint / doctor
- `npm run lint` — clean, no output.
- `npm run typecheck` — 2 errors:
  1. `app/(tabs)/inicio.tsx:89` — `'/transferir'` not assignable to the route
     union. Expected: the `/transferir` route file doesn't exist yet (lane F,
     `add-transfers`, hasn't landed). The string itself is correct per the
     fixed cross-lane contract; this is exactly the "cross-lane route-typing
     noise" the validator brief anticipated, not a lane-A bug.
  2. `app/login.tsx:41` — see "Bug found outside lane A's ownership" above.
     Not a lane-A file.
  Neither error traces to a genuine defect in a lane-A-owned file.
- `npm run doctor` — 1 failure: duplicate lock files (`pnpm-lock.yaml` +
  `package-lock.json`) detected repo-wide. Pre-existing, unrelated to any
  file this change touches.

### tasks.md — left unchecked, and why
- **1.4** (route stubs for `prestamos.tsx`/`apartados.tsx`) — per
  `WORKFLOW.md`'s lane table these are owned outright by lanes D/E (full
  content, not a separate stub step from lane A); lane A didn't create them,
  so left unchecked here rather than credited to this change.
- **2.2** (source display name from session state) — `SessionResponse` (
  `src/api/types.ts`) has no display-name field yet (only `session_id` +
  `accessibility_profile`), so there is nothing in session state to source
  from. A mocked constant + sensible `'Usuario'` fallback stands in, matching
  the backend-coordination gap already flagged in `proposal.md`'s Impact
  section. Left unchecked as not literally done.
- **6.1** (typecheck/lint/doctor all clean) — lint is clean, but typecheck and
  doctor each have one finding (detailed above); neither is a lane-A defect,
  but the item as worded requires all three clean, so left unchecked.
- **6.2** (screenshot comparison) — no simulator/device is attached in this
  environment, so no rendered screenshot of the running app could be taken.
  This validator instead compared Figma's `get_design_context`/`get_screenshot`
  output directly against the `inicio.tsx` source (findings above) — a
  reasonable substitute, but not the literal device-screenshot check this
  item describes, so left unchecked.
- **6.3** (tab state preservation) — requires a running device/simulator,
  none attached. Left unchecked.

Checked off as genuinely verified: 1.1, 1.2, 1.3a, 1.3 (filesystem-level
only), 1.5, 2.1, 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2.
