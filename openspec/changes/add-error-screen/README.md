# add-error-screen

General error screen matching Figma, reused across the app for unrecoverable request failures

## Validation note (2026-09-12)

Validated independently (fresh review, not the executor) against
`src/catalog/shared/ErrorScreen.tsx` and `src/catalog/shared/errorCodes.ts`
as they exist on disk, plus a live pull of Figma node `37:351`
(fileKey `G8zaBTJpiBYqLWtdb3DQ6g`) via `get_design_context` and
`get_screenshot`.

**Verified:**
- Both files exist, are complete, and contain no TODOs or stubbed logic.
- `npm run typecheck` and `npm run lint` are fully clean project-wide (no
  errors anywhere, not just in these two files).
- `npm run doctor` reports one failing check (duplicate lock files —
  `pnpm-lock.yaml` + `package-lock.json`); this is a pre-existing,
  project-wide condition unrelated to this lane's files and not something
  either of these two files caused.
- Props contract is sound: `code` required, `message` optional (overrides
  only the description line, not the registry heading), `onPrimaryAction`
  optional and defaults to `router.replace('/')`, which — per
  `app/index.tsx` — resolves to `/inicio` when a session exists and
  `/login` otherwise. This matches the spec's "Volver al inicio always
  recovers to a working state" requirement at the code-logic level.
- Error code registry covers all three required failure categories
  (`ERR_SESSION_001`, `ERR_NETWORK_001`, `ERR_SERVER_001`), documents the
  `ERR_<AREA>_<NUMBER>` convention in a header comment, and has a safe
  fallback (`getErrorCopy` falls back to the generic server-error copy for
  an unregistered code instead of rendering blank text).

**Matches Figma structurally and near-pixel-exactly on spacing that was
replicated:** back chevron in a 44px red status bar, Banorte wordmark,
double-ring icon badge (soft tint → white ring → red 64px badge with white
alert-circle glyph), "¡Oops!" in 44px brand-red, bold 22px sub-heading,
15px secondary-color message, pill-shaped code tag, full-width 52px
primary button with the exact drop-shadow Figma specifies
(`rgba(236,0,41,0.15)`, offset 0/4, radius 6), and the support link with a
trailing chevron. Content-area padding (`pt 40 / px 32 / pb 48`, `gap 40`)
and the actions-block's extra `pt 20` match Figma's spec values exactly.

**Deviations found, all judged acceptable:**
- Text colors (`#1C1C1E`/`#757579`) are close-but-not-identical to Figma's
  literal hex (`#1a1a1a`/`#6b7280`) — existing `theme/tokens.ts` tokens
  reused rather than adding new hex literals, as instructed.
- The outer icon-circle tint uses `${colors.brand.primary}12` (~7% alpha)
  as a stand-in for Figma's very soft `#fff5f6`, which back-calculates to
  roughly 4% alpha over white. The code comment on this line correctly
  explains why an alpha-blended brand token was chosen over a new literal;
  the alpha value is roughly 2x too strong, so the tint will read as
  slightly more saturated than Figma's design. Cosmetic only, worth a
  follow-up tweak (`12` → `0A`) but not a structural mismatch.
- The primary button label uses `typography.button` (weight 700) where
  Figma specifies semibold (600); the support-link text correctly uses 600.
  Minor, traces to reusing the one shared button text token rather than a
  hardcoded weight.
- Figma nests extra padding inside `header-brand` (pb 16) and
  `illustration-container` (py 12) on top of the 40px section gap, making
  the wordmark-to-icon and icon-to-heading gaps slightly larger
  (~68px/~52px) than what's built (a flat 40px gap for those two
  transitions). Minor compaction, not a structural issue — everything above
  is still present, in the same order, still readable and centered.

No hardcoded hex colors without justification were found; every color
traces to `theme/tokens.ts` or a documented alpha-blend of a token.

**Tasks checked off:** §1 (Component) and §2 (Error code registry) in full,
plus §4.1 (typecheck/lint/doctor — doctor's one failure is unrelated to
this lane, see above).

**Left unchecked, deliberately:**
- §3 (Adoption) — out of scope this pass per `WORKFLOW.md`; no wiring into
  `app/index.tsx` or any real failure path was supposed to happen yet, and
  none did.
- §4.2 (screenshot comparison) — I compared Figma's own rendering (via
  `get_screenshot`/`get_design_context`) against the component's source
  line-by-line, which is as far as a code-level review can go, but this
  task specifically calls for a screenshot of the *running* component,
  which needs a simulator/device. None is attached in this environment, so
  this stays unchecked rather than being marked done on an incomplete
  check.
- §4.3 (Volver al inicio recovery with/without a session) — the default
  navigation's logic was traced through `app/index.tsx` and looks correct
  (routes to `/inicio` or `/login` depending on session state), but
  actually confirming the behavior means running the app and pressing the
  button in both session states, which isn't possible without a
  simulator/device here.

No changes were made outside this lane's file ownership. No bugs were
found in `ErrorScreen.tsx` or `errorCodes.ts` significant enough to warrant
an edit, so neither file was touched.
