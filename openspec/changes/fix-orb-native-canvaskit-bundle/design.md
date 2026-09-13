## Context

`@shopify/react-native-skia` ships one package for native and web, but only the
web path needs the CanvasKit WASM runtime. `AnimatedOrb.tsx` needs the web
bootstrap (`LoadSkiaWeb`) and also runs on native, so the import had to become
platform-aware. The codebase already has the exact pattern for this:
`useOrbAmplitude.ts` (TS declaration) + `.native.ts` + `.web.ts`, resolved by
Metro per platform.

## Goals / Non-Goals

**Goals:**
- Native (iOS/Android) bundles the orb without ever resolving `canvaskit-wasm`
  or its Node-only `fs`/`path` requires.
- Web keeps loading `canvaskit.wasm` before Skia's web binding is evaluated.
- One small, local change; no change to the orb's props, renderer, or the screen.

**Non-Goals:**
- Removing or replacing `@shopify/react-native-skia`.
- Changing `public/canvaskit.wasm`, `OrbCanvas.tsx`, `useOrbAmplitude*`, or the
  amplitude data flow.
- Any backend, A2UI, or wire-contract change.

## Decisions

**1. Platform-suffixed shim, not a Metro/`fs` alias.** A `metro.config.js`
`resolver.resolveRequest` alias (or stubbing `fs`/`path`) would work but is
global and affects every import; the shim is local to this feature and matches
the project's established platform-file convention.

**2. Not a dynamic `import()`.** Metro still includes dynamically imported
modules in the native graph by default, so `await import('.../web')` inside a
`Platform.OS === 'web'` branch would still pull `canvaskit-wasm` in and still
fail. The resolution has to happen at the platform-file level.

**3. Base `.ts` must stay declaration-only.** If `skiaWeb.ts` had a runtime body
that imported the web subpath, Metro could resolve it instead of the
platform file. It mirrors `useOrbAmplitude.ts` (declaration only, never bundled).

**4. `OrbCanvas` stays dynamically required on web.** Loading the main Skia
package before `LoadSkiaWeb()` resolves still throws "CanvasKit is not defined"
on web; that existing behavior is unchanged. On native the no-op resolves
immediately and `OrbCanvas` loads as before.

## Risks / Trade-offs

- **[Risk]** `@shopify/react-native-skia` is a native dependency, so the orb
  still needs a dev-client rebuild to render on a device (it never renders in
  Expo Go). → Expected and consistent with the other native deps in this app;
  removing the `fs` crash is a bundling fix, not a substitute for the rebuild.
- **[Risk]** A future refactor could import the web subpath directly again. →
  `skiaWeb.native.ts` is deliberately import-free; keep web-only Skia bootstrap
  behind this module.
- **[Risk]** TypeScript resolves `./skiaWeb` to the declaration file while Metro
  resolves a platform file. → Same established pattern as `useOrbAmplitude`, so
  type signatures are kept identical across the three files.
