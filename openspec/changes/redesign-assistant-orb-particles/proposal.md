## Why

`src/features/assistant-orb/AnimatedOrb.tsx` (built by `add-assistant-orb-screen`) is a hand-built `LinearGradient` + `BlurView` circle with a breathing scale animation — it reads as "alive" but not as reactive to the user, and its own `design.md` documented real audio-reactivity as an explicit non-goal. The user asked for the Soporte IA orb to instead look and behave like a modern voice-AI assistant (Siri/Apple Intelligence-style): a particle cloud that visibly reacts to the user's own voice while they're talking to it, not just a looping idle animation. A reference implementation (`VoiceOrb.tsx`, provided externally) already solves this with `@shopify/react-native-skia`'s `<Points>` API driven by Reanimated worklets.

## What Changes

- Replaces `AnimatedOrb`'s internals with a Skia particle-sphere renderer (Fibonacci-distributed point cloud, two `<Points>` layers — blurred glow + crisp core — mixing `#33489E → #8B6BF2` by voice amplitude), keeping its existing public contract (`{ isListening?: boolean }`) so `app/(tabs)/asistente.tsx` needs no changes.
- Adds real voice-reactivity: a new `useOrbAmplitude(isListening)` hook, platform-split like the existing `useSpeechToText`/audio hooks:
  - **Native**: reads the mic level from `expo-speech-recognition`'s own `volumechange` event (now enabled via `volumeChangeEventOptions` in `useSpeechToText.ts`'s `.start()` call) through a small cross-component shared value (`micVolumeSignal`) — no second microphone session.
  - **Web**: opens its own `getUserMedia` + `AnalyserNode` only while `isListening` is true, mirroring the reference project's web implementation.
- Adds `@shopify/react-native-skia` as a new native dependency.

## Capabilities

### Modified Capabilities
- `mobile/assistant`: the idle orb's "continuous animation" requirement is extended — while listening, the orb now visibly reacts to the user's voice amplitude, not just its own idle breathing/rotation.

### New Capabilities
- `mobile/assistant-orb`: the particle-orb rendering engine and its voice-amplitude data source, as a capability independent of the screen that hosts it (so it can be reused by other screens later without re-speccing the screen itself).

## Impact

- `src/features/assistant-orb/AnimatedOrb.tsx` — rewritten (same props, new internals).
- New: `src/features/assistant-orb/{OrbCanvas.tsx, particleSphere.ts, useOrbAmplitude.ts, useOrbAmplitude.native.ts, useOrbAmplitude.web.ts, micVolumeSignal.ts}`.
- New: `public/canvaskit.wasm` (the *full* CanvasKit build, not the default one — see `design.md`) — Expo Web serves `public/` at the app root, which `LoadSkiaWeb` fetches from at runtime.
- `src/features/voice/useSpeechToText.ts` — enables `volumeChangeEventOptions` on `.start()` and forwards the `volumechange` event into `micVolumeSignal`; no change to its public return shape or the STT flow itself.
- New dependency: `@shopify/react-native-skia` (installed via `npx expo install`, SDK-matched — see `design.md` for why this reverses `add-assistant-orb-screen`'s earlier rejection of Skia).
- This does **not** revert or reopen anything else from `add-assistant-orb-screen` (idle/active state machine, Escribir/Hablar entry points, screen layout) — only the orb's internal rendering and its data source change.
