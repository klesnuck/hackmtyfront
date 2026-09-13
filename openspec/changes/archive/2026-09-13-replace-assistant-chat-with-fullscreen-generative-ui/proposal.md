## Why

The Soporte IA (Asistente) screen currently accumulates every turn — user bubbles, agent bubbles, and each A2UI-generated surface — in a scrolling history below the input, so the assistant reads as a conventional chat thread. The product direction is for the agent's generated UI to be the whole experience: each answer should take over the screen like a real interface (a loan comparison, a scenario table), not sit inside a chat bubble the user has to scroll to. Keeping a growing chat log also means old generated surfaces (bound to stale data-model snapshots) stay on screen and re-render below new ones, which is confusing once a surface is meant to represent "the current answer," not a history entry.

## What Changes

- **BREAKING**: Remove the persistent chat/history container from the Asistente screen (`app/(tabs)/asistente.tsx`'s `FlatList` of `turns` and `TurnBubble`). User and agent turn text bubbles are no longer accumulated or displayed in a scrolling list.
- The most recently generated A2UI surface now renders full-panel: it replaces the entire Asistente screen's content area (covering the idle header, greeting, mic, and input), animating in with a slide-up-from-bottom transition. This is inline content replacing the screen's render tree, not a modal/overlay (no backdrop, no dismiss-outside-to-close, no stacking context above other screens).
- While a generated surface is showing full-panel, the "Luna" orb (`AnimatedOrb`) relocates to a floating circular affordance pinned to the bottom-right corner of the screen, becoming the only visible way to keep talking to the assistant (voice or reopening text input) without leaving the current generated surface.
- The floating orb cycles through short suggested-prompt bubbles near it (e.g. "¿Tienes otra duda?", "¿Quieres saber algo más?", "¿Te gustaría cambiar tu préstamo?"), fading/sliding in and out on a repeating timer, to invite the next interaction.
- **BREAKING**: Generated surfaces no longer coexist. When the agent produces a new A2UI surface, it replaces the currently displayed one outright (the old surface unmounts, not scrolled past) and the new surface plays the same slide-up-from-bottom entrance animation as the first surface — including the very first surface generated in a session.
- The idle header (greeting, centered orb, mic, text input) remains the landing state exactly as today when no surface has been generated yet; this change only alters what happens once the agent produces its first generated UI.

## Capabilities

### New Capabilities
- `mobile/assistant`: Soporte IA screen — idle greeting screen plus the active state, already declared (not yet archived) by `add-assistant-orb-screen` and `add-assistant-voice-transcription`. This change adds a delta spec describing the full-panel single-surface replacement behavior and the floating-orb re-engagement affordance described above.

## Impact

- **Affected code**: `app/(tabs)/asistente.tsx` (removes the `turns` `FlatList`/`TurnBubble` history rendering; adds full-panel surface mounting and slide-up transition), `src/features/assistant-orb/AnimatedOrb.tsx` (needs a floating/pinned layout variant and a suggested-prompts affordance, in addition to its current idle-header placement), `src/a2ui/renderer.tsx`/`src/a2ui/store.ts` (surface lifecycle: only the latest surface needs to be mounted/kept, prior surfaces can be discarded rather than retained for scrollback).
- **Conflicts with an existing pending change**: `add-assistant-voice-transcription` proposes fixing the orb/greeting/mic/input in place while only the turn history scrolls internally — the opposite of removing that history and going full-panel. That change's `mobile/assistant` delta and `design.md` should be reconciled or superseded when this change is applied; do not implement both layout directions.
- **Out of scope**: whether transcript/turn text is still persisted server-side or in local state for analytics/debugging — this change only concerns what is rendered on screen, not what is stored.
