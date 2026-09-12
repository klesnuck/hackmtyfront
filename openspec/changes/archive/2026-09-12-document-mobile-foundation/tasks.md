## 1. A2UI engine

- [x] 1.1 Transcribe A2UI v0.9.1 message types from the official spec (`src/a2ui/types.ts`)
- [x] 1.2 Implement JSON Pointer get/set/delete for data binding (`src/a2ui/path.ts`)
- [x] 1.3 Implement the per-surface store applying `createSurface`/`updateComponents`/`updateDataModel`/`deleteSurface` (`src/a2ui/store.ts`)
- [x] 1.4 Implement the closed-type catalog registry (`src/a2ui/registry.ts`)
- [x] 1.5 Implement the renderer with unknown-node fallback and nested-reference resolution (`src/a2ui/renderer.tsx`)
- [x] 1.6 Implement the action dispatch bus (`src/a2ui/actionBus.ts`, `src/a2ui/context.tsx`)

## 2. Standard catalog

- [x] 2.1 Implement all 18 A2UI basic catalog component types (`src/catalog/standard/`)
- [x] 2.2 Implement shared press-feedback primitive (`src/catalog/shared/AnimatedPressable.tsx`)

## 3. Accessible catalog

- [x] 3.1 Implement `voz-color` catalog with compile-time parity to `standard` (`src/catalog/voz-color/`)
- [x] 3.2 Give Text and Button accessible-specific styling
- [ ] 3.3 Give TextField, CheckBox, ChoicePicker, Slider, DateTimeInput accessible-specific styling (tracked, not yet done — left as an open item rather than silently marked complete)

## 4. Session / login

- [x] 4.1 Port the Figma login design (node 37:2) to React Native (`app/login.tsx`)
- [x] 4.2 Wire login to `POST /api/session` (mocked, not auth) (`src/features/session/useCreateSession.ts`)
- [x] 4.3 Persist `session_id` and restore on launch (`src/state/session.store.ts`, `app/index.tsx`)

## 5. Voice

- [x] 5.1 Implement mic recording via `expo-audio` (`src/features/voice/useVoiceRecorder.ts`)
- [x] 5.2 Implement TTS asset caching and playback (`src/features/voice/audioCache.ts`)
- [x] 5.3 Implement the recording pulse animation (`src/features/voice/RecordingPulse.tsx`)

## 6. Documentation migration

- [x] 6.1 Confirm every requirement above against the actual source files (not memory)
- [x] 6.2 Delete `MOBILE_SPECS.md` once this change is archived and `openspec/specs/` is confirmed to carry its content
