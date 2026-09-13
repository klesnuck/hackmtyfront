## 1. Platform shim

- [ ] 1.1 Add `src/features/assistant-orb/skiaWeb.ts` — declaration-only `loadSkiaWeb(opts?)` type
- [ ] 1.2 Add `src/features/assistant-orb/skiaWeb.web.ts` — re-export `LoadSkiaWeb as loadSkiaWeb` from `@shopify/react-native-skia/lib/module/web`
- [ ] 1.3 Add `src/features/assistant-orb/skiaWeb.native.ts` — no-op `loadSkiaWeb()` with no web import

## 2. Wire-up

- [ ] 2.1 `AnimatedOrb.tsx`: import `loadSkiaWeb` from `./skiaWeb` and call it in place of `LoadSkiaWeb` (web branch unchanged)
- [ ] 2.2 Update `AnimatedOrb.tsx`'s top comment to document the platform split

## 3. Verification

- [ ] 3.1 `npx tsc --noEmit` — clean for the touched files
- [ ] 3.2 `npx expo export --platform ios` (and `android`) — bundles without `Unable to resolve module fs`
- [ ] 3.3 `npx expo export --platform web` — bundles and still resolves CanvasKit
- [ ] 3.4 `npx -y @fission-ai/openspec@latest validate --all` — green
- [ ] 3.5 Device check (dev-client rebuild): orb renders on iOS/Android (no device in this environment)
