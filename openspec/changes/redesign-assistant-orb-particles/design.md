## Context

`add-assistant-orb-screen/design.md` evaluated a Skia-based orb (`react-native-magic-orb`, an npm wrapper built for exactly this Siri/Apple-Intelligence-style effect) and rejected it for two reasons: (1) the wrapper was immature (v0.1.8), and (2) it would pull `@shopify/react-native-skia` in as a **new native dependency**, and the project wanted to avoid new native dependencies during the hackathon build.

Reason (2) no longer holds. This project already ships a custom dev client (`expo-dev-client` in `package.json`) because `expo-speech-recognition` — the STT engine `useSpeechToText.ts` uses — is a third-party native module that does not run in standard Expo Go (see the guarded `require('expo-speech-recognition')` in that file, with an explicit comment about why). Standard Expo Go was never actually available to this app once that dependency landed; "no new native dependency" stopped being a real constraint at that point, it just hadn't been revisited.

The user provided a working reference component, `voice-orb/VoiceOrb.tsx`, built directly against `@shopify/react-native-skia` (not the rejected wrapper) — the same library Skia itself, used directly, with no immaturity risk: it's the standard, widely-used RN graphics engine, already vetted enough that Expo bundles first-class support for it.

## Goals / Non-Goals

**Goals:**
- Port the reference's particle-sphere rendering technique (Fibonacci sphere, two `<Points>` layers, per-particle bulge with fast-attack/slow-release) into this codebase's `AnimatedOrb`, unchanged in its external contract.
- Real voice-reactivity while listening — closing the non-goal `add-assistant-orb-screen/design.md` explicitly deferred.
- No second, competing microphone session on native.

**Non-Goals:**
- Reacting to TTS playback (the assistant's own voice) — only the user's mic input while `isListening` is true. Can be layered on later the same way `add-assistant-orb-screen` deferred this.
- Changing the idle/active state machine, screen layout, or entry points built by `add-assistant-orb-screen` — out of scope here.
- A generic/reusable "voice orb" package — this is scoped to this app's one orb instance; `mobile/assistant-orb` is split out as its own capability only so its *requirements* (render technique, amplitude contract) are documented independently of the screen, not because the code is meant to be published standalone.

## Decisions

**Amplitude source — native.** The reference project's native hook (`useVoiceAmplitude.native.ts`) uses `expo-av`'s recording metering. This project has no `expo-av` (replaced by `expo-audio` everywhere — see `src/catalog/standard/AudioPlayer.tsx`'s comment on why `expo-av` was dropped from Expo Go in SDK 55+). More importantly, opening a *second* recorder via `expo-audio` while `expo-speech-recognition` already has an active recognition session open would compete for the same native audio session (`AVAudioSession` on iOS) — a real conflict risk, not a style preference.

Verified in `node_modules/expo-speech-recognition/src/ExpoSpeechRecognitionModule.types.ts:170`: the module already emits a `volumechange` event (`{ value: number }`, roughly -2..10) when `volumeChangeEventOptions: { enabled: true }` is passed to `.start()`. This is the *same* mic session already open for recognition — zero additional capture. `useSpeechToText.ts` now enables this option and forwards each event into a small module-level Reanimated shared value (`micVolumeSignal`, created with `makeMutable` so it exists outside any single component's tree) that the orb's own hook (`useOrbAmplitude.native.ts`) reads via `useDerivedValue`, gated to 0 whenever `isListening` is false.

**Amplitude source — web.** No such conflict exists on web (browser `SpeechRecognition`, which `expo-speech-recognition`'s web build wraps, doesn't expose volume metering and doesn't need an explicit `getUserMedia` call the way our own analyser does). `useOrbAmplitude.web.ts` ports the reference's `useVoiceAmplitude.web.ts` almost directly: `getUserMedia` + `AnalyserNode`, RMS with an adaptive rolling noise-floor/peak so "loud" self-calibrates per device, fast-attack/slow-release smoothing — except scoped to open/close around `isListening` transitions instead of component mount, so idle never requests the mic.

**Idle motion stays clock-driven, not amplitude-driven.** In the reference `VoiceOrb.tsx`, the idle "breathing" (`breathe = 1 + 0.05*sin(t*0.002+seed*20)`) is computed from Skia's `useClock()` alone, entirely independent of `amplitude` — only the *bulge* deformation depends on amplitude, and naturally goes to ~0 at rest. Ported as-is: no synthetic idle amplitude wave is needed, `useOrbAmplitude` can simply hold `0` while not listening, and the orb still visibly breathes/rotates continuously (satisfying `mobile/assistant`'s existing "orb animates continuously" requirement) purely from the clock term.

**Colors.** The reference defaults to `#6C5CE7`→`#00E5FF` (purple→cyan). Kept the palette already validated against Figma by `add-assistant-orb-screen` (`#33489E` deep blue idle → `#8B6BF2` violet active, `#5856D6` as the soft background glow) instead, so this reads as a rendering-engine upgrade, not a rebrand.

**No `micEnabled`/internal-mic prop on the orb itself.** The reference `VoiceOrb` can open its own mic (`micEnabled` prop) since it's a standalone demo. Here, mic ownership stays entirely with `useSpeechToText` (already the single source of truth for `isListening` and mic permissions) — the orb only ever *reads* amplitude, driven by the `isListening` prop it already received in the previous implementation.

## Web bootstrap (discovered during implementation)

Two web-only issues surfaced only once actually run in a browser (not caught by `typecheck`/`lint`/`expo-doctor`), both fixed:

1. **CanvasKit-WASM must load before Skia's web module is ever `require`d.** `AnimatedOrb.tsx` originally imported `Canvas`/`Points`/etc. from `@shopify/react-native-skia` at module top level — on web, that import evaluates Skia's CanvasKit binding immediately, before any component mounts. Fixed by splitting the actual renderer into `OrbCanvas.tsx` and making `AnimatedOrb.tsx` the platform gate: it calls `LoadSkiaWeb({ locateFile: (file) => '/' + file })` (imported from the safe `@shopify/react-native-skia/lib/module/web` subpath, which has no side effect on import) inside a `useEffect`, then only `require()`s `OrbCanvas` — and therefore only evaluates the main Skia package — after that resolves. Exactly the pattern the reference project's own `src/app/index.tsx` uses, for the same documented reason ("Skia's web CanvasKit binding is captured once, at require-time").
2. **`LoadSkiaWeb` needs the *full* CanvasKit WASM build, not the default one.** `LoadSkiaWeb`'s `locateFile` fetches `canvaskit.wasm` from the app's web root, which Expo serves from `public/`. Copying `node_modules/canvaskit-wasm/bin/canvaskit.wasm` (the default "lite" build) loaded without error but threw a bare `Infinity` exception from inside the WASM the first time the `<Points>`/`<BlurMask>` bindings this component uses were exercised — the lite build is missing bindings `@shopify/react-native-skia`'s web layer needs. Diffing against the reference project's own `public/canvaskit.wasm` (byte-identical to `node_modules/canvaskit-wasm/bin/full/canvaskit.wasm`, ~8.08MB vs. the lite build's ~7.16MB) confirmed it ships the **full** build. `public/canvaskit.wasm` here now does the same. Verified with a headless-Chromium run against both the fixed component and the untouched reference project side by side — same particle sphere renders, same benign `NotSupportedError`-on-mic-in-headless-Chromium warning, no `Infinity`/`CanvasKit is not defined` errors.

## Palette (revised after visual review)

The saturated deep-blue/violet palette (`#33489E`/`#8B6BF2`/`#5856D6`, carried
over from `add-assistant-orb-screen`'s Figma-validated gradient orb) read as
too heavy once rendered as a dense particle sphere with a halo behind it — a
plain-colored disc reads differently than the same hue spread across
thousands of small points plus a glowing backdrop. Replaced with a light
gray/silver-blue family instead, per explicit user feedback: particles
`#9AA5C0` (idle) -> `#D6DEEE` (brightens while listening), inner glow behind
the particles `#B8C2D9`, halo `#AEB9D8` with a near-white `#F5F8FF` hot core.
Chosen to stay visibly distinct from the app's `#F4F5F7` background
(`theme/tokens.ts` `colors.surface.app`) rather than the pale end of the
range the user offered, since a color close enough to the background would
make the particle detail unreadable.

## Ambient halo (added after initial review)

After seeing the particle orb in the browser, the initial version read as too
small and flat against the screen's plain background. Two changes:

- **Size**: `ORB_SIZE` 160 -> 200 and `particleCount` 1600 -> 2000
  (proportionally, so particle density per unit area stays roughly the same).
- **Ambient glow**: a soft radial halo behind the particle sphere, in
  `AnimatedOrb.tsx` rather than inside `OrbCanvas`/Skia. Uses
  `react-native-svg`'s `RadialGradient` (already a dependency) instead of
  `expo-linear-gradient`'s `LinearGradient` (used by the pre-Skia
  `AnimatedOrb`) because a linear gradient can only fade corner-to-corner,
  not radially from center — it can't produce the "diffuse illuminated
  circle" look on its own. Kept outside the Skia canvas rather than as
  another Skia `BlurMask` layer: Skia clips its own drawing to the canvas's
  pixel bounds, so a halo meaningfully bigger than the particle sphere would
  need the canvas itself enlarged well past where the particles actually sit
  (wasted overdraw); a plain SVG behind the canvas has no such constraint and
  renders even during the brief window before Skia/CanvasKit finishes
  loading on web. Breathes gently via the same Reanimated
  `withRepeat`/`withTiming` pattern the original hand-built orb used, and
  brightens further while `isListening`.

## Risks / Trade-offs

- `@shopify/react-native-skia` requires a dev-client rebuild to take effect on-device (not hot-reloadable into an already-running dev client binary) — expected and consistent with every other native dependency already in this project; not a new class of risk.
- `expo-speech-recognition`'s `volumechange` timing/scale (`intervalMillis`, the -2..10 range) is iOS-documented; Android behavior isn't independently verified here — no device is available in this environment. Left as an explicit follow-up device check in `tasks.md`, same pattern `add-assistant-orb-screen/tasks.md` used for its own iOS/Android visual check.
- Particle count (1600) is a starting default tuned for mid-range phones per the reference project's own guidance (2500–4000 "fluid on mid-range"); this app's orb is smaller (160dp vs. the reference's 260–280dp default) so a lower count still reads as dense. Revisit if a real device shows frame drops.
