## Why

Incorporating the Skia particle orb (`redesign-assistant-orb-particles`) crashes
the **native** (iOS/Android) bundle at Metro resolution time:

```
Unable to resolve module fs from
node_modules/.pnpm/canvaskit-wasm@0.41.0/node_modules/canvaskit-wasm/bin/full/canvaskit.js
```

`src/features/assistant-orb/AnimatedOrb.tsx` statically imported
`LoadSkiaWeb` from `@shopify/react-native-skia/lib/module/web`. That subpath's
`LoadSkiaWeb.js` does `import CanvasKitInit from "canvaskit-wasm/bin/full/canvaskit"`,
and the CanvasKit Emscripten glue contains a literal Node-only
`if(qa){var fs=require("fs");require("path");...}` that Metro cannot statically
eliminate. Native never needs CanvasKit — it uses Skia's native backend — but the
static import pulled the web-only WASM glue into the iOS/Android module graph.

This is not a runtime CanvasKit failure; it is a web-only bootstrap leaking into
the native bundle. The orb's actual renderer (`OrbCanvas.tsx` → main
`@shopify/react-native-skia`) is fully supported natively.

## What Changes

- Platform-split the Skia web bootstrap, mirroring the existing
  `useOrbAmplitude.native.ts` / `.web.ts` convention:
  - `skiaWeb.ts` — declaration-only type shim (never bundled).
  - `skiaWeb.web.ts` — re-exports Skia's `LoadSkiaWeb`.
  - `skiaWeb.native.ts` — no-op `loadSkiaWeb()`; imports nothing from the web.
- `AnimatedOrb.tsx` imports `loadSkiaWeb` from `./skiaWeb` instead of importing
  the web subpath directly; the existing `Platform.OS === 'web'` guard is kept.
- Native therefore resolves the no-op and never sees `canvaskit-wasm`/`fs`; web
  is unchanged (still loads the full `public/canvaskit.wasm` before requiring
  `OrbCanvas`).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `mobile/assistant-orb`: adds the requirement that the web-only CanvasKit
  bootstrap stays out of the native module graph while web keeps its CanvasKit
  load step.

> `mobile/assistant-orb` is introduced by the still-pending
> `redesign-assistant-orb-particles`. Classify this delta as MODIFIED if that
> change is archived first, otherwise ADDED (used here).

## Impact

- New: `src/features/assistant-orb/{skiaWeb.ts, skiaWeb.web.ts, skiaWeb.native.ts}`.
- `src/features/assistant-orb/AnimatedOrb.tsx` — import source and top comment
  only; public props, `OrbCanvas.tsx`, `useOrbAmplitude*`, `micVolumeSignal`, and
  the backend are untouched.
- No wire/A2UI contract change.
- Verification: `npx tsc --noEmit`; a forced native Metro bundle confirms `fs`
  is gone; a web bundle confirms CanvasKit still resolves; `openspec validate`.
  On-device rendering requires a dev-client rebuild (Skia is a native dep).
