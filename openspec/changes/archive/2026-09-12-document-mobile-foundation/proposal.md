## Why

The mobile app's A2UI engine, both catalogs, the login/session screen, and voice capture were built before this repository adopted spec-driven development with OpenSpec (they were tracked in an ad hoc root `MOBILE_SPECS.md` instead). That file is retired (`AGENTS.md` §2a). This change captures what is **already implemented and running** as proper OpenSpec baseline specs, so `openspec/specs/` reflects deployed truth before any further change proposals build on top of it.

This is a documentation change, not new work: no code changes, no behavior changes. Every requirement below is verified against the actual files in `src/a2ui/`, `src/catalog/`, `app/login.tsx`, `src/features/session/`, and `src/features/voice/`.

## What Changes

- Establishes five baseline capabilities reflecting the mobile app as it exists today.
- Deliberately does **not** baseline `mobile/dashboard` or `mobile/assistant` as Figma-accurate — those two screens exist in code but do not yet match the Figma designs reviewed after they were built. They will be baselined via their own alignment changes (`align-navigation-and-dashboard-with-figma`, `align-assistant-with-figma`) once corrected, so this change doesn't assert a false "matches Figma" baseline.

## Capabilities

### New Capabilities
- `mobile/a2ui-engine`: the A2UI v0.9.1 runtime — message types, JSON-Pointer data binding, the per-surface store, the closed-type component registry, the renderer, and the action dispatch bus.
- `mobile/catalog-standard`: the default RN-primitive implementation of all 18 A2UI "basic" catalog component types.
- `mobile/catalog-accessible`: the `voz-color` catalog (REQ-ACC-02 equivalent) — same node-type vocabulary as standard, enforced at compile time.
- `mobile/session`: session bootstrap (login screen + `POST /api/session`), not an auth system.
- `mobile/voice`: microphone capture, base64 encoding, and TTS asset playback/caching.

### Modified Capabilities
(none — first baseline)

## Impact

- Affected paths: `src/a2ui/`, `src/catalog/standard/`, `src/catalog/voz-color/`, `app/login.tsx`, `src/features/session/`, `src/features/voice/`.
- No code changes. Purely establishes `openspec/specs/` as the source of truth going forward, superseding `MOBILE_SPECS.md` (to be deleted once this change is archived).
