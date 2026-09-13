## Context

`app/(tabs)/asistente.tsx` currently owns one `FlatList` whose header is the idle content (orb, greeting, mic, input) and whose items are `turns: Turn[]`, each rendered by `TurnBubble` — agent turns mount `<A2UISurface surfaceId={turn.surfaceId} />` inline as one bubble among many. `src/a2ui/store.ts` is a single global Zustand store keyed by `surfaceId`, deliberately shared across the whole app (its own comment: "a surface created for one screen may be referenced again later, e.g. the Kill Test replays a real surface" — `MOBILE_ARCHITECTURE.md` §8). That store never deletes a surface on its own; only an explicit `deleteSurface` A2UI message or a manual `removeSurface()` call does. See `proposal.md` for why the panel is moving from a scrolling history to a single full-panel surface.

## Goals / Non-Goals

**Goals:**
- Replace the turn list with: idle header (unchanged) → full-panel surface (new) → floating orb + suggested prompts once a surface is showing.
- Only one generated surface ever mounted/visible at a time, each new one fully replacing the last with a consistent entrance animation.
- Reuse the existing `AnimatedOrb` component and the existing `A2UISurface` renderer as-is — this change is about screen composition and transitions, not about the orb's internal animation or the A2UI engine's parsing/binding logic.

**Non-Goals:**
- Changing the global `src/a2ui/store.ts` surface lifecycle (create/update/delete semantics) or removing surfaces from that store when superseded on screen — other consumers (e.g. Kill Test) may still reference an older `surfaceId`. "Replacing" here is purely about what the Asistente screen chooses to render, not about deleting store state.
- Persisting or displaying turn/message text anywhere in this screen. Whether it's still logged server-side is out of scope (see `proposal.md` - Impact).
- Voice capture/transcription behavior (`mobile/voice`) — unchanged; the mic still records/transcribes the same way, only its container moves (idle header vs. floating-orb-triggered).

## Decisions

**Screen state becomes a 3-way discriminated state, not a growing list.** Replace `turns: Turn[]` (accumulating) with something like `panelState: { kind: 'idle' } | { kind: 'surface'; surfaceId: string }`. Idle renders today's header unchanged. `surface` renders `<A2UISurface surfaceId={panelState.surfaceId} />` full-panel and switches the orb to its floating variant. Each time the agent response yields a new `surfaceId`, `panelState` is replaced (not appended) — this makes "always exactly one visible surface" a structural invariant instead of a rule the render code has to enforce by only reading the last array item.

**Entrance animation keys off `surfaceId`, using Reanimated's `key`-remount pattern already idiomatic in this codebase.** Mount the full-panel surface wrapper with `key={panelState.surfaceId}` so React fully remounts it on every new surface (not just re-renders), and drive the slide-up with `react-native-reanimated`'s `entering={SlideInDown}` (or an equivalent `withTiming`-based translateY, matching however `redesign-assistant-orb-particles` already sets its animation conventions) on that wrapper. Remounting on key change guarantees the *same* entrance animation replays for every new surface, including the first, with no separate "is this the first surface" branch.

**Full-panel surface is a sibling overlay in the same screen tree, not a route/modal.** Per `proposal.md`, this must not be a modal (no backdrop, no dismiss-outside). Implementation-wise this means an absolutely-positioned `View` covering the screen's content area, conditionally rendered by `panelState.kind === 'surface'`, rather than `expo-router`'s modal presentation or a `<Modal>` component — both of those carry OS-level modal semantics (backdrop, swipe-to-dismiss on iOS, separate a11y focus trap) the proposal explicitly excludes.

**Floating orb is a new layout variant of `AnimatedOrb`, not a new component.** `AnimatedOrb` already takes `isListening`; add a `variant: 'idle' | 'floating'` (or equivalent positioning prop) so `floating` applies `position: absolute`, bottom-right placement, and a smaller scale, while the particle/Skia rendering internals (`OrbCanvas`, `particleSphere.ts`) are untouched. Keeps the Skia bootstrap fix from `fix-orb-native-canvaskit-bundle` (commit `b190355`) intact — no changes to `skiaWeb.*`.

**Suggested-prompt rotation is a small local component next to the floating orb, driven by a fixed interval + a static prompt list.** No backend involvement: the three example prompts (and any others) are a local array cycled with `setInterval`/`withDelay`-chained Reanimated fades, each prompt shown for a few seconds then hidden before the next one appears (matching the `#### Scenario: Idle floating state` spec). Keeping this fully client-local avoids adding a new API dependency for a cosmetic nudge.

## Risks / Trade-offs

- [Two other pending changes (`add-assistant-orb-screen`, `add-assistant-voice-transcription`) declare `mobile/assistant` deltas that assume an inline, scrolling turn list] → Flagged in `proposal.md` - Impact; whichever of those changes is applied second should drop or rewrite its now-contradicted requirements (inline-in-conversation rendering, fixed-header-with-scrolling-history) rather than both being implemented.
- [Discarding `turns` state entirely also discards today's only place where a user's transcribed text was ever shown] → Accepted per `proposal.md`'s explicit scope (screen no longer displays turn text at all); if a future need arises to inspect what was asked, it must be solved outside this screen (e.g. a debug/history view), not by reintroducing the removed container.
- [`key`-remount on every new surface briefly unmounts+remounts `A2UISurface`, which could lose any surface-local (non-store) UI state, e.g. transient input focus inside a form component] → Acceptable since `SurfaceState` (components + dataModel) lives in the global store, not in the surface component's own state, so a remount re-renders identical content; verify during apply that no catalog component keeps meaningful state outside the store.
