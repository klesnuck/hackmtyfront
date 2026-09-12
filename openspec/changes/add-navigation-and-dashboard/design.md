## Context

The current `app/dashboard.tsx` and `app/assistant.tsx` were built without the Figma references (they were designed from the product description alone). Reviewing Figma nodes `37:42` (dashboard) and the bottom-nav pattern shared across `37:42`/`37:160`/`37:266` shows a persistent 4-tab shell that doesn't exist yet, and a dashboard body with different content than what was built. This change fixes the shell and the dashboard; `add-assistant-orb-screen` fixes the assistant tab's content separately.

## Goals / Non-Goals

**Goals:**
- Match Figma's navigation and dashboard pixel-for-pixel in structure (colors, spacing, copy) using the existing `theme/tokens.ts` palette (Figma's red matches our existing `colors.brand.primary` `#EC0029` — no token changes needed).
- Keep the existing `<A2UISurface />`-based assistant conversation working once it's reached via the new tab.

**Non-Goals:**
- Does not implement a real account-balance backend endpoint — `SPECS.md` §8 has no such resource. Mocked pending backend coordination (flagged in the proposal's Impact section).
- Does not implement the Préstamos/Apartados tab *content* — those are `add-loans-management` and `add-savings-management`. This change only wires the tab routes to them.

## Decisions

- **Expo Router `Tabs` layout** (`app/(tabs)/_layout.tsx`) over a hand-rolled bottom bar — it's the standard, well-supported pattern for this exact shape and integrates with the existing Stack-based pre-login flow (`app/login.tsx`, `app/index.tsx` stay outside the group).
- **Icons via `@expo/vector-icons`' Ionicons**, already a dependency (`mobile/catalog-standard`'s Icon component uses it) — reuse the same icon set rather than introducing a second one for nav-bar glyphs.
- **Mock account data lives in one module** (`src/features/dashboard/mockAccount.ts` or similar) rather than inline in the component, so swapping to a real endpoint later touches one file.

## Repurposing decision (2026-09-12)

The current `app/dashboard.tsx` (pre-Figma) is not a generic dashboard — it's
already an intermediate routing panel: two cards (La Mesa / Saving Bags) that
each push to the assistant with a specific `intent` param, plus a general
"Habla con tu asistente" CTA. Its job doesn't change; only how it's reached
does. Instead of retiring it, it becomes the destination of the new
dashboard's "Asistente de Préstamos IA" banner (§3), replacing the originally
planned direct route to the Soporte IA tab — this screen's whole purpose is
narrowing down which specific thing the user wants before handing off to the
agent with that intent already attached, which is a better fit for a button
literally named "Asistente de Préstamos IA" than dropping the user into the
general orb/chat idle screen.

Mechanically: its content moves, unchanged, to `app/asistente-prestamos.tsx`
— a pushed (non-tab) stack screen, so the tab bar hides while it's open
(matching how the assistant chat screen already behaves), with a back
chevron added since it's no longer a tab root. No visual redesign: it
already uses `theme/tokens.ts` exclusively, so the only style adjustment is
the added header/back affordance for consistency with other pushed screens.
Its navigation target updates from `/assistant` to `/asistente` to match
`add-assistant-orb-screen`'s route rename.

## Risks / Trade-offs

- Restructuring `app/dashboard.tsx` and `app/assistant.tsx` into `app/(tabs)/` changes their route paths (`/dashboard` → `/(tabs)/inicio` or similar) — anything that deep-links to the old paths (none currently, but worth noting) would need updating.
- Mocked balance data risks looking "faked" in a demo if a judge asks where it comes from — mitigate by being upfront that it's synthetic (consistent with `AGENTS.md` §2's "data realism matters less than idea quality" and the anti-fluff rule).
