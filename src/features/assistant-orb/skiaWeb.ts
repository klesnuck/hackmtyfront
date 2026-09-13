/**
 * Web-only Skia bootstrap, platform-split like `useOrbAmplitude`.
 *
 * `@shopify/react-native-skia/lib/module/web` pulls in `canvaskit-wasm`, whose
 * Emscripten glue contains a Node-only `require("fs")`/`require("path")` that
 * Metro cannot resolve on iOS/Android. This declaration file is what TypeScript
 * resolves (`import { loadSkiaWeb } from './skiaWeb'`); Metro never bundles it —
 * it picks `skiaWeb.web.ts` on web and the no-op `skiaWeb.native.ts` on native,
 * so CanvasKit stays out of the native module graph.
 */
export declare function loadSkiaWeb(opts?: {
  locateFile?: (file: string) => string;
}): Promise<void>;
