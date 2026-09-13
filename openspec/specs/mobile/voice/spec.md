# mobile/voice Specification

## Purpose

Microphone capture for sending voice messages to the agent, and cached playback of backend-generated TTS audio — the mechanism behind REQ-ACC-03/04's full-duplex voice experience.

## Requirements

### Requirement: Voice capture transcribes speech to Spanish text on-device
The system SHALL use on-device speech recognition (not a network audio upload) to convert the user's spoken input into Spanish (`es-MX`) text, requesting microphone and speech-recognition permission once per app session, and SHALL submit only the finalized transcript — never raw audio — through the same text-message path used for typed input (`sendMessage({ session_id, text })`).

#### Scenario: First recognition request
- **WHEN** the user presses the mic control for the first time in a session
- **THEN** the system requests microphone and speech-recognition permission before listening starts, and does not re-prompt on subsequent presses within the same session

#### Scenario: Permission denied
- **WHEN** the user denies microphone or speech-recognition permission
- **THEN** listening does not start and the user sees a message explaining the mic is unavailable, without the app crashing

#### Scenario: Live partial transcript
- **WHEN** the user is actively speaking after pressing the mic control
- **THEN** the system shows the in-progress recognized text before the user stops, updating as recognition refines it

#### Scenario: Finalized transcript is submitted as text
- **WHEN** the user presses the mic control again to stop listening and a non-empty transcript was recognized
- **THEN** the system submits that transcript through the text-message path (`sendMessage` with a `text` field), with no `audio_b64` sent for this interaction

#### Scenario: Nothing recognized
- **WHEN** the user stops listening without any speech having been recognized
- **THEN** no message is submitted and no empty user turn is added

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
