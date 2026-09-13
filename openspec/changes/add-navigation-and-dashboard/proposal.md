## Why

Reviewing the Figma reference for the home screen (node `37:42`, fileKey `G8zaBTJpiBYqLWtdb3DQ6g`) against what was actually built surfaced two gaps:

1. **No bottom tab navigation exists at all.** The Figma design (and every other screen reviewed alongside it — Préstamos Activos, Mis Ahorros) shares a persistent 4-tab bar: Inicio, Préstamos, Apartados, Soporte IA. The current app only has stack push navigation (`router.push`), with no tabs.
2. **The dashboard content doesn't match.** Figma's home screen has: a slim red header with a greeting + user avatar + notification bell; a dark "Asistente de Préstamos" banner card; a white account balance card (bank name, masked account number, available balance, CLABE with copy affordance); and a 3-icon "Operaciones rápidas" row (Ahorros, Préstamos, Transferir). The current dashboard has a plain greeting and two generic list-style action cards — none of the above.

## What Changes

- Introduces bottom tab navigation (Expo Router `Tabs`) with 4 tabs: Inicio, Préstamos, Apartados, Soporte IA — matching Figma's `bottom-nav` component across every screen it appears on.
- Rebuilds the dashboard (Inicio tab) to match Figma: header with greeting/avatar/bell, "Asistente de Préstamos" banner (routes to `app/asistente-prestamos.tsx`, the existing La Mesa/Saving Bags intent picker — see `design.md`'s "Repurposing decision", not the Soporte IA tab), account balance card, and a 3-icon quick-actions row (Ahorros → Apartados tab, Préstamos → Préstamos tab, Transferir → the transfers flow from `add-transfers`).
- The Préstamos and Apartados tabs route to the screens introduced by `add-loans-management` and `add-savings-management` respectively — this change defines the tab shell and routes to them, not their content.

## Capabilities

### New Capabilities
- `mobile/navigation`: the 4-tab bottom navigation shell shared across the main app screens.
- `mobile/dashboard`: the home/Inicio tab content (header, AI banner, balance card, quick actions).

## Impact

- Restructures `app/` routing: `app/assistant.tsx` moves under a new `app/(tabs)/` group (renamed `asistente.tsx`, see `add-assistant-orb-screen`); `app/dashboard.tsx`'s content relocates to `app/asistente-prestamos.tsx` (pushed, non-tab — see `design.md`), and `app/(tabs)/inicio.tsx` is built fresh from Figma rather than being a move of the old dashboard; `app/(tabs)/prestamos.tsx` and `app/(tabs)/apartados.tsx` are added as route stubs here (their content is built by their own changes).
- `app/login.tsx` and `app/index.tsx` stay outside the tab group (pre-session).
- The account balance/CLABE data shown on the dashboard has no backing endpoint in `SPECS.md` §8 yet (the frozen contract has no "account" resource). This change uses mocked placeholder data and flags the gap in `design.md` — needs backend team coordination before this is real.
