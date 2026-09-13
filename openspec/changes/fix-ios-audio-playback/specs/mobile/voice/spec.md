## MODIFIED Requirements

### Requirement: TTS assets are cached locally by asset id
The system SHALL download a `GET /api/audio/{asset_id}` response to a local cache file keyed by `asset_id`, using a file extension that matches the asset's actual media format (the backend serves MP3 / `audio/mpeg`), and SHALL reuse the cached file on any repeat playback of the same asset without re-downloading. It SHALL NOT store MP3 bytes under a container extension the platform's audio decoder cannot load.

#### Scenario: Repeated phrase
- **WHEN** the same `audio_ref` is played twice in a session
- **THEN** only the first playback triggers a network download; the second plays from the local cache

#### Scenario: Cached asset is playable on iOS
- **WHEN** a TTS asset has been cached and is played on iOS
- **THEN** the cached file's extension matches its MP3 content and playback succeeds, rather than silently failing to load

## ADDED Requirements

### Requirement: Playback configures the audio session for media
The system SHALL configure a media playback audio session (audible regardless of the device's silent/ringer switch) before playing backend TTS, and SHALL re-assert that playback session after on-device speech recognition ends, since recognition can leave the audio session in a recording category.

#### Scenario: Silent switch is on
- **WHEN** the device's silent/ringer switch is on and the assistant plays a spoken reply on iOS
- **THEN** the reply is audible

#### Scenario: Turn immediately after a spoken turn
- **WHEN** the user speaks a turn and the assistant then plays its reply
- **THEN** the reply is audible (the playback session was restored after recognition)

### Requirement: Playback failures are observable
The system SHALL treat audio playback as non-blocking, but SHALL surface a failed download, load, or play in development instead of discarding it silently.

#### Scenario: Asset cannot be played
- **WHEN** a TTS asset fails to download, load, or play
- **THEN** the app continues to function and a development warning is emitted

### Requirement: Playback volume stays consistent after the microphone
The system SHALL reset the iOS audio session to media playback after on-device speech recognition ends — deactivating the recognizer's session and restoring the playback category/mode — so the assistant's reply is as loud as the first greeting, instead of being routed through the quiet record/voice-processed path. Playback SHALL route through the speaker, not the earpiece, and use exclusive audio focus.

#### Scenario: First greeting
- **WHEN** the app has just opened and the assistant plays its greeting
- **THEN** the audio is played through the speaker at full media volume

#### Scenario: Reply immediately after a spoken turn
- **WHEN** the user records a turn with the microphone and the assistant then plays its reply
- **THEN** the reply plays at the same volume as the greeting (the recognizer's audio session was released and the playback session restored)

#### Scenario: Explicit playback routing
- **WHEN** any TTS asset is about to play
- **THEN** the audio session is configured to not route through the earpiece and to take exclusive focus before the player starts

