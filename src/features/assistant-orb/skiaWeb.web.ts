/**
 * Web: the real CanvasKit bootstrap. Loads `canvaskit.wasm` (served from
 * `public/`) into `global.CanvasKit` before `OrbCanvas` is required, since
 * Skia's web binding is captured once at require-time.
 */
export { LoadSkiaWeb as loadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
