## 1. Screen state model

- [x] 1.1 Replace `asistente.tsx`'s `turns: Turn[]` accumulator with a discriminated `panelState: { kind: 'idle' } | { kind: 'surface'; surfaceId: string }` (or equivalent), updated by replacement, never by append.
- [x] 1.2 Update the message-submit handler(s) (text submit, voice submit) so a new `surfaceId` from the agent's response sets `panelState = { kind: 'surface', surfaceId }` instead of pushing a new turn.
- [x] 1.3 Remove the `turns` `FlatList` and `TurnBubble` rendering entirely; remove any now-unused turn-related types/state/refs (e.g. `listRef` autoscroll logic) left over from the old history view.

## 2. Full-panel surface rendering

- [x] 2.1 Render `<A2UISurface surfaceId={panelState.surfaceId} />` as an absolutely-positioned full-panel `View` when `panelState.kind === 'surface'`, covering the idle header/greeting/mic/input — not a `<Modal>` or router-modal route.
- [x] 2.2 Key the full-panel wrapper by `surfaceId` (`key={panelState.surfaceId}`) so React remounts it on every new surface.
- [x] 2.3 Apply a Reanimated slide-up-from-bottom entrance animation (e.g. `entering={SlideInDown}` or an equivalent `withTiming` translateY) to the keyed wrapper, verified to replay identically for the first surface and every subsequent replacement.
- [x] 2.4 Confirm no backdrop/dismiss-outside/overlay semantics are present (no `<Modal>`, no dimmed background view, no swipe-to-dismiss).

## 3. Floating orb variant

- [x] 3.1 Add a `variant` (or equivalent) prop to `AnimatedOrb` for `'idle'` (today's centered header placement) vs. `'floating'` (absolute, bottom-right, smaller scale) without touching `OrbCanvas`/`particleSphere.ts`/`skiaWeb.*` internals.
- [x] 3.2 In `asistente.tsx`, render `AnimatedOrb` with `variant="floating"` when `panelState.kind === 'surface'`, and keep `variant="idle"` for the idle state.
- [x] 3.3 Wire the floating orb's press/voice interaction to submit a new message the same way the idle mic/input already do, without changing `panelState` until a new surface actually arrives (the current full-panel surface stays visible while the user is composing/speaking the next message).

## 4. Suggested-prompt rotation

- [x] 4.1 Add a local suggested-prompts list (e.g. "¿Tienes otra duda?", "¿Quieres saber algo más?", "¿Te gustaría cambiar tu préstamo?") and a small component that cycles through it near the floating orb.
- [x] 4.2 Animate each prompt in and out (fade/slide) on a repeating interval, only while `variant="floating"` is active, pausing/resetting when the panel returns to idle.

## 5. Cleanup and verification

- [x] 5.1 Verify `src/a2ui/store.ts` is untouched (no new `removeSurface` calls added from this screen) so other consumers (e.g. Kill Test) can still reference superseded surfaces.
- [ ] 5.2 Manually verify on web and native: idle → first surface (slide-up, orb floats, header/input gone), second message → old surface replaced by new one with the same slide-up animation, floating orb + suggested prompts remain interactive throughout. **(manual — not performed by the automating agent; requires an interactive device/simulator session.)**
- [x] 5.3 Run lint/typecheck for the touched files (`asistente.tsx`, `AnimatedOrb.tsx`) and confirm no unused-turn-state warnings remain.

