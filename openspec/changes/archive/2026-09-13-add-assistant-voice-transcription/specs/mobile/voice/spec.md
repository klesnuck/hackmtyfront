## REMOVED Requirements

### Requirement: Voice capture uses expo-audio, never the deprecated expo-av
**Reason**: The mic path no longer uploads audio for server-side transcription — speech is converted to text on-device (see the new "Voice capture transcribes speech to Spanish text on-device" requirement), so there is no recorded file to encode as `audio_b64` for `POST /api/message` from this path.
**Migration**: Call sites that used `useVoiceRecorder()`'s `stop()` (which returned a base64 payload) switch to the new speech-recognition hook, whose `stop()` returns the finalized transcript text and is submitted through the same `sendMessage({ session_id, text })` call already used for typed input. `expo-audio` itself is unaffected elsewhere (TTS reply caching/playback still uses it).

#### Scenario: First recording request
- **WHEN** the user presses the mic control for the first time in a session
- **THEN** the system requests microphone permission before recording, and does not re-prompt on subsequent presses within the same session

#### Scenario: Permission denied
- **WHEN** the user denies microphone permission
- **THEN** recording does not start and the user sees a message explaining the mic is unavailable, without the app crashing

## ADDED Requirements

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
