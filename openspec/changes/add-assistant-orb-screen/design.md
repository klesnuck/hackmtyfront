## Context

Figma's orb (node `37:143`, "orb-inner-glow") is a soft, blurred, rotating purple/blue gradient circle inside a larger soft glow (`37:142`, "orb-outer-glow", `blur-[8px]`, low-opacity `rgba(88,86,214,0.04)` background). It's a static export in the Figma file, but the product intent (and the user's explicit ask) is a **living, animated** orb — this is the moment in the app most associated with "the LLM is thinking/listening," so it's worth getting the motion right, not just the shape.

## Goals / Non-Goals

**Goals:**
- A convincing "alive" floating/breathing/color-shifting orb, matching Figma's soft purple/blue glow.
- No new native dependency risk beyond what's already proven safe in this codebase (`react-native-reanimated` v4, already used throughout).

**Non-Goals:**
- Real audio-reactivity (the orb pulsing in sync with mic input level) — nice-to-have, not required by Figma or the requirements above. Can be layered on later using the same `useVoiceRecorder` hook's metering data if `expo-audio` exposes it, without changing the orb's base implementation.

## Decisions

**Evaluated: `react-native-magic-orb`.** A purpose-built npm package (Skia shaders + Reanimated, explicitly modeled on Apple Intelligence/Siri) that does exactly this and even supports voice-reactivity. Checked npm: **v0.1.8** — pre-1.0, low version number, indicates real immaturity risk for a package this niche. Would also pull in `@shopify/react-native-skia` as a new native dependency (currently unused anywhere in this codebase) purely for this one component. Rejected for the same reason Moti was rejected during initial setup (`CHANGELOG.md` [2026-09-12] bootstrap entry, `mobile/catalog-standard`... this codebase already has one documented precedent for "small animation-wrapper package, unconfirmed maturity → don't risk it during a hackathon build").

**Chosen: hand-built orb using `expo-linear-gradient` (already a dependency) + `expo-blur` (official Expo module — install via `npx expo install expo-blur`, SDK-matched) + `react-native-reanimated` (already used throughout).** Approach:
- A `LinearGradient` circle (purple→blue, matching Figma's hex values) as the orb core.
- Wrapped in a `BlurView` (or layered blur via `expo-blur`) for the soft glow, matching Figma's `blur-[8px]` outer glow.
- Reanimated drives: a slow breathing scale (`withRepeat(withTiming(...), -1, true)`), a slow hue/gradient-angle rotation for the "living" color shift, and the whole thing mounts/unmounts with the idle screen (no animation runs off-screen).
- This is the same pattern already established for `RecordingPulse` (`mobile/voice`) — a small, self-contained Reanimated-driven component with no extra dependency risk.

## Risks / Trade-offs

- A hand-built gradient+blur orb will not look as physically "liquid"/shader-quality as a Skia-based one. Acceptable trade-off for a hackathon timeline given the maturity risk of the alternative; revisit post-hackathon if the team wants to invest in `react-native-skia` properly (with its own evaluation, not borrowed from a 0.1.x wrapper).
- `expo-blur` behaves slightly differently across iOS/Android (native blur vs. a fallback) — verify visually on both platforms during apply, not just one.
