## 1. Dependency

- [x] 1.1 `npx expo install @shopify/react-native-skia`, then `npx expo-doctor` to confirm a clean tree (aside from the pre-existing, unrelated dual-lock-file finding)

## 2. Particle engine

- [x] 2.1 Port `fibonacciSphere` + `mixColor` helpers into `src/features/assistant-orb/particleSphere.ts`
- [x] 2.2 Rewrite `AnimatedOrb.tsx` to render two Skia `<Points>` layers (blurred glow + crisp core) over a Fibonacci sphere, driven by `useClock` + `useDerivedValue`
- [x] 2.3 Keep `AnimatedOrb`'s public signature (`{ isListening?: boolean }`) unchanged so `app/(tabs)/asistente.tsx` requires no edits
- [x] 2.4 Match the previously Figma-validated palette (`#33489E` / `#8B6BF2` / `#5856D6`) instead of the reference project's defaults
- [x] 2.5 Enlarge the orb (`ORB_SIZE` 160 -> 200, `particleCount` 1600 -> 2000) and add a soft ambient glow halo (`react-native-svg` `RadialGradient`, breathing, brighter while listening) behind the particle sphere, per user feedback that the initial size/plain-background read as too small and flat

## 3. Voice amplitude

- [x] 3.1 Add `micVolumeSignal.ts` (module-level `makeMutable` shared value)
- [x] 3.2 Enable `volumeChangeEventOptions` in `useSpeechToText.ts`'s `.start()` call and forward `volumechange` events into `micVolumeSignal`, with reset-to-0 on `end`/`error`
- [x] 3.3 Add `useOrbAmplitude.native.ts` — derives from `micVolumeSignal`, gated to 0 when not listening
- [x] 3.4 Add `useOrbAmplitude.web.ts` — own `getUserMedia`/`AnalyserNode`, opened/closed around `isListening` transitions only
- [x] 3.5 Add `useOrbAmplitude.ts` platform-resolution type declaration (mirrors `useSpeechToText`'s existing pattern for platform-specific hooks)

## 4. Verification

- [x] 4.1 `npm run typecheck` — clean for every file this change touches (one pre-existing, unrelated error remains in `app/(tabs)/asistente.tsx` — a `loanConsult.send` call-signature mismatch not introduced by this change; left as-is, out of scope)
- [x] 4.2 `npm run lint` — zero errors (pre-existing warnings elsewhere unrelated to this change)
- [x] 4.3 `npx expo-doctor` — clean aside from the pre-existing dual-lock-file finding
- [ ] 4.4 Device/simulator check on iOS and Android: confirm the orb renders, animates, and visibly reacts while speaking (no device available in this environment)
- [x] 4.5 Web check (`npx expo start --web`): confirmed via headless Chromium (screenshot + zero console/page errors) that the idle particle orb renders on `/asistente` — required two fixes not caught by typecheck/lint, see `design.md`'s "Web bootstrap" section (deferred Skia require past `LoadSkiaWeb()`; copying the *full* `canvaskit.wasm` build into `public/`, not the default one). Live-mic voice-reactivity itself (the `AnalyserNode` path while actually speaking) still needs a human with a real microphone — headless Chromium has none.
