/**
 * Native: no-op. iOS/Android use Skia's native backend, so there is no
 * CanvasKit/WASM step — and deliberately no import of the web module, which
 * would drag `canvaskit-wasm` (`require("fs")`) into the native bundle.
 */
export async function loadSkiaWeb(
  _opts?: { locateFile?: (file: string) => string },
): Promise<void> {}
