# mobile/voice Specification

## Purpose

Microphone capture for sending voice messages to the agent, and cached playback of backend-generated TTS audio — the mechanism behind REQ-ACC-03/04's full-duplex voice experience.

## Requirements

### Requirement: Voice capture uses expo-audio, never the deprecated expo-av
The system SHALL record audio via `expo-audio`'s recorder API, requesting microphone permission once per app session, and encode the recorded file as base64 for `POST /api/message`'s `audio_b64` field.

#### Scenario: First recording request
- **WHEN** the user presses the mic control for the first time in a session
- **THEN** the system requests microphone permission before recording, and does not re-prompt on subsequent presses within the same session

#### Scenario: Permission denied
- **WHEN** the user denies microphone permission
- **THEN** recording does not start and the user sees a message explaining the mic is unavailable, without the app crashing

### Requirement: TTS assets are cached locally by asset id
The system SHALL download a `GET /api/audio/{asset_id}` response to a local cache file keyed by `asset_id` before first playback, and reuse the cached file on any repeat playback of the same asset without re-downloading.

#### Scenario: Repeated phrase
- **WHEN** the same `audio_ref` is played twice in a session
- **THEN** only the first playback triggers a network download; the second plays from the local cache

### Requirement: Recording state has a visible affordance
The system SHALL show a distinct animated visual state while actively recording, separate from the idle mic control state.

#### Scenario: Recording in progress
- **WHEN** the user is actively recording
- **THEN** the mic control shows a continuous animated indicator (an expanding pulse) that stops immediately when recording ends
