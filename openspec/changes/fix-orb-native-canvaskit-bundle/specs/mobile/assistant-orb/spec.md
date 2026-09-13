## ADDED Requirements

### Requirement: Orb boots on native without the web CanvasKit bundle
The system SHALL keep the web-only Skia/CanvasKit bootstrap (`LoadSkiaWeb` and
`canvaskit-wasm`) out of the iOS/Android Metro module graph, so importing the orb
on native never resolves Node-only modules (`fs`, `path`). On web, the system
SHALL still load `canvaskit.wasm` before the Skia renderer is evaluated.

#### Scenario: Native bundle
- **WHEN** the app is bundled for iOS or Android
- **THEN** the orb's resolved module graph excludes `canvaskit-wasm` and `fs`,
  and the orb renders using Skia's native backend

#### Scenario: Web unchanged
- **WHEN** the app is bundled for web
- **THEN** `LoadSkiaWeb` still loads the full `canvaskit.wasm` before the Skia
  particle renderer is required
