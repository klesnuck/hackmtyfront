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
