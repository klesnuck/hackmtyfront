# add-assistant-orb-screen

Idle greeting screen with an animated floating orb and Escribir/Hablar entry points, matching Figma

## Validation note (2026-09-12)

Validated independently (fresh context, no executor self-report available — it was cut off by a
rate limit before it could report). Verified from scratch per `openspec/WORKFLOW.md`'s validator role.

**Files checked:** `app/(tabs)/asistente.tsx`, `src/features/assistant-orb/AnimatedOrb.tsx`.
Confirmed `app/assistant.tsx` no longer exists at the app root (git shows it as `D`, moved).

**Pre-existing chat logic preserved:** diffed the new file against `git show HEAD:app/assistant.tsx`
line by line. `submitText`, `submitAudio`, `handleMicPress`, the one-shot initial-intent effect
(`hasSentInitialIntent` ref, `INTENT_PROMPTS`), `TurnBubble`/`EmptyState`/A2UI rendering, and all
existing styles are byte-for-byte unchanged except import path depth (`../` → `../../`, expected from
the file move) and one added `ref={textInputRef}` on the existing `TextInput` (needed for the new
"Escribir focuses the input" behavior). Everything else in the diff is purely additive: `manualActive`
state, `hasIntentPrompt`/`isActive` derivation, a `useFocusEffect` for idle-reset-on-revisit,
`handleEscribir`/`handleHablar`, the idle-focus effect, the `if (!isActive)` early-return branch, and
the new `IdleGreeting` component + its styles. No regression risk to the working chat path.

**State machine:** `isActive = turns.length > 0 || manualActive || hasIntentPrompt`. Idle renders only
when none of those are true. Escribir sets `manualActive` and focuses the text input once the active
view mounts (via a ref + short timeout, since the `TextInput` doesn't exist during idle render); Hablar
sets `manualActive` and calls the existing `handleMicPress` immediately (starts recording, no second
tap needed). A dashboard `intent` param (from `app/asistente-prestamos.tsx`, a different lane) makes
`hasIntentPrompt` true, which skips idle entirely and lets the existing initial-intent effect fire
`submitText` with the mapped prompt — the cross-lane route contract (`/asistente` + `intent` param,
values `la-mesa` / `saving-bags`) was confirmed by grepping `app/asistente-prestamos.tsx`, which
matches `INTENT_PROMPTS`'s keys exactly. `useFocusEffect` resets `manualActive` to `false` on tab
refocus whenever there are still no turns and no intent, satisfying tasks.md 4.2 and the spec's
"revisit mid-idle" scenario.

**Orb animation cleanup:** `AnimatedOrb` starts both shared values in a `useEffect` and cancels both
(`cancelAnimation`) in the cleanup function, so nothing keeps animating past unmount. The orb only
mounts while the idle branch is rendered, and unmounts as soon as `isActive` becomes true. One caveat,
not a failure: Expo Router's `Tabs` (no `unmountOnBlur` set in `app/(tabs)/_layout.tsx`) keeps sibling
tab screens mounted-but-unfocused by default, so whether the orb's animation is actually paused when
the user switches to a *different* tab (rather than transitioning idle→active within Soporte IA)
depends on React Navigation's screen-freeze behavior, which isn't verifiable statically — left
unchecked in spirit as a device-only concern (see below), though the component-level cleanup contract
itself is correctly implemented.

**expo-blur:** confirmed installed and SDK-matched (`"expo-blur": "~57.0.3"` against `expo@57.0.22`).
`npx expo-doctor` passes except one pre-existing, unrelated finding (both `pnpm-lock.yaml` and
`package-lock.json` present in the repo — `pnpm-lock.yaml` predates this change, already committed at
an earlier commit; not introduced by this lane and outside this lane's file ownership to fix).

**Figma comparison** (node `37:123`, fileKey `G8zaBTJpiBYqLWtdb3DQ6g`, via live `get_screenshot` +
`get_design_context`): header bar (`#EC0029` red, chevron-back + "Asistente IA" 18px bold white),
greeting copy ("¿En qué te puedo ayudar?" 22px bold + the exact "Hola Carlos..." body copy), and both
entry buttons (Escribir: `#F4F5F7` fill / `#E5E5EA` border / keyboard icon; Hablar: `#EC0029` fill /
mic icon, both white-on-red or dark-on-light 15px semibold text) match structurally and match
`theme/tokens.ts` exactly (`colors.brand.primary`, `colors.surface.field`, `colors.border.subtle`,
`typography.h2`/`h3`/`bodyStrong`/`body`). The `ai-body` container's literal `pt-100/pb-64/gap-48/px-24`
Figma values are reproduced as literal pixels in `idleBody` (documented in-code, since the spacing
scale has no matching step) — correct.

Two acceptable, documented deviations in the orb itself:
- Figma's orb is a static radial gradient (`#E0F7FF` → `#8E56FF` → `#005EFF`) with a colored drop
  shadow; the built `AnimatedOrb` uses a diagonal `LinearGradient` with a different, more muted stop
  set (`#33489E`/`#5856D6`/`#8B6BF2`) and a flat `rgba(88,86,214,0.22)` glow behind a `BlurView`
  (Figma's own glow layer is `rgba(88,86,214,0.04)`, barely visible without background-blur, which RN
  can't replicate the same way `expo-blur` blurs backgrounds). This is exactly the trade-off
  `design.md` already calls out ("will not look as physically liquid/shader-quality as a Skia-based
  one... acceptable trade-off for a hackathon timeline") — visually it still reads as the intended
  purple/blue glowing orb, just less luminous at the core. Not a structural mismatch.
- Escribir's icon uses Ionicons `keypad-outline` in place of Figma's plain "keyboard" glyph — a
  reasonable icon-set substitution (no exact keyboard equivalent used elsewhere in this codebase's
  Ionicons usage), same visual intent.

**Typecheck/lint:** `npm run typecheck` — zero errors in either owned file (the two errors present
are pre-existing cross-lane route-typing noise in `app/login.tsx` and `app/transferir.tsx`, other
lanes' files). `npm run lint` — zero warnings/errors project-wide.

**Left unchecked, deliberately:** tasks.md 5.2 ("visual check on iOS and Android / Expo Go") requires
a running device or simulator, which isn't available in this environment — left unchecked per the
validator instructions rather than assumed. Everything else in `tasks.md` was checked off only after
being independently verified above (not carried over from any executor report, since none was
available).

**Verdict: pass.** No files were touched outside `tasks.md` and this README — no bug was found in
`app/(tabs)/asistente.tsx` or `AnimatedOrb.tsx` that warranted a fix.
