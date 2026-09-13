# redesign-assistant-orb-particles

Replaces the assistant orb's hand-built gradient+blur renderer with a Skia particle-sphere engine, reactive to the user's live voice amplitude.

## Build note (2026-09-12)

Built and self-verified in one pass (no separate validator invocation for this change).

**Files touched:** `src/features/assistant-orb/AnimatedOrb.tsx` (rewritten, same
`{ isListening?: boolean }` contract — `app/(tabs)/asistente.tsx` needed no edits),
new `particleSphere.ts`, `micVolumeSignal.ts`, `useOrbAmplitude.{ts,native.ts,web.ts}`,
and `src/features/voice/useSpeechToText.ts` (enables `volumeChangeEventOptions` on
`.start()`, forwards `volumechange` into `micVolumeSignal`, resets it to 0 on
`end`/`error`).

**Dependency:** `@shopify/react-native-skia@2.6.2` installed via
`npx expo install`, SDK-57-matched — same version the reference project pins.

**Typecheck:** `npm run typecheck` — clean for every file this change owns.
One pre-existing error remains, unrelated to this change: `app/(tabs)/asistente.tsx:158`
calls `loanConsult.send(text, currentSessionId)` with two arguments, but
`useLoanConsult.ts`'s `send` only accepts one (`text: string`). Confirmed via
`git status`/`git diff` that this file was not touched by this change and the
error is not something this change introduced — left unfixed as out of scope
(a loans-flow bug, not an orb/voice-amplitude issue).

**Lint:** `npm run lint` — 0 errors project-wide. Remaining warnings (unused
`FadeIn`/`SlideInDown`/`SlideOutDown` imports in `apartados.tsx`, duplicate
`types.ts` imports in `api/endpoints.ts`, an unused `useEffect` import and one
`require()`-style import in `useSpeechToText.ts`) all predate this change —
confirmed the unused `useEffect` import was already unused before this edit,
not introduced by it.

**expo-doctor:** clean except the pre-existing dual-lock-file finding
(`pnpm-lock.yaml` + `package-lock.json` both present), already documented as
out-of-lane in `add-assistant-orb-screen/README.md`.

**Design decisions worth flagging:**
- Native amplitude reuses `expo-speech-recognition`'s own `volumechange` event
  (verified to exist in `node_modules/expo-speech-recognition/src/ExpoSpeechRecognitionModule.types.ts:170`)
  instead of opening a second `expo-audio` recorder, specifically to avoid
  fighting the already-open recognition session for the native audio session.
- Idle "breathing" is driven purely by Skia's `useClock()`, independent of the
  amplitude signal — matches the reference project's own architecture, and
  means `useOrbAmplitude` never needs to fabricate an idle wave (amplitude is
  simply 0 at rest).
- Palette kept at the previously Figma-validated `#33489E`/`#8B6BF2`/`#5856D6`
  rather than the reference project's own default purple/cyan.

**Web check (4.5), actually run:** started `npx expo start --web` (port 8090 —
8081 was already in use by the reference `voice-orb/orb-demo` project) and
drove it with headless Chromium (Playwright). Two real bugs surfaced, neither
caught by typecheck/lint/doctor:
1. `AnimatedOrb.tsx` originally imported `@shopify/react-native-skia` at
   module top level, which on web evaluates Skia's CanvasKit binding before
   `LoadSkiaWeb()` had a chance to run → `"CanvasKit is not defined"`. Fixed
   by splitting the renderer into `OrbCanvas.tsx` and making `AnimatedOrb.tsx`
   a platform gate that only `require()`s it after `LoadSkiaWeb()` resolves
   on web (native loads it immediately) — see `design.md`.
2. Even after that fix, the orb threw a bare `Infinity` exception from inside
   the WASM on its first paint. Comparing byte-for-byte against the reference
   project's own `public/canvaskit.wasm` showed it ships
   `canvaskit-wasm/bin/full/canvaskit.wasm` (~8.08MB), not the default
   `bin/canvaskit.wasm` (~7.16MB) I'd copied — the default build is missing
   bindings this component's `<Points>`/`<BlurMask>` usage needs. Replaced
   `public/canvaskit.wasm` with the full build.

After both fixes: screenshot + zero `console`/`pageerror` output confirms the
particle orb renders correctly on `/asistente`'s idle screen, in the same
spot the old gradient circle occupied. Side-by-side headless run against the
untouched reference project showed identical behavior (same benign
`NotSupportedError` mic warning in headless Chromium, no other errors).

**Left unchecked, deliberately:** `tasks.md` 4.4 (device check on iOS/Android)
and the live-voice-reactivity half of 4.5 (an actual human speaking into a
real mic) — no device and no real microphone available in this environment.
The mic-session-reuse logic (native, via `volumechange`) and the
`AnalyserNode` lifecycle (web) are implemented and typecheck clean, and the
web path is now confirmed to render without crashing, but neither platform's
*reactive* behavior while someone is actually talking has been confirmed —
noted as a real gap, not assumed to pass.

**Verdict:** builds cleanly against this repo's existing conventions
(`expo-audio`-only, no `expo-av`; `theme/tokens.ts`-independent since this
orb's colors were already outside the token system before this change);
no regression found in the idle/active state machine or entry points from
`add-assistant-orb-screen`, which this change does not touch.
