## ADDED Requirements

### Requirement: Backend origin is normalized before use
The system SHALL construct the backend origin in exactly one place and SHALL
remove all trailing slashes, so concatenating a leading-slash API path can never
produce `//` (which the edge answers with 404 and the backend never logs).

#### Scenario: Configured origin has a trailing slash
- **WHEN** the configured backend origin ends in one or more `/`
- **THEN** requests are sent to `origin + /api/...` with no doubled slash

#### Scenario: Configured origin has no trailing slash
- **WHEN** the configured backend origin has no trailing slash
- **THEN** requests are sent unchanged (single slash)

### Requirement: The assistant greets reliably once per session
The system SHALL send the welcome greeting when the Asistente screen is focused
without an explicit intent, SHALL mark the session greeted only after a
successful greeting, and SHALL NOT discard an in-flight greeting because of a
re-render or blur, so it can retry on the next focus.

#### Scenario: Greeting succeeds
- **WHEN** the Asistente tab is focused with a session and no intent
- **THEN** the greeting text and audio are shown once for that session

#### Scenario: Greeting fails transiently
- **WHEN** the greeting request fails
- **THEN** the session is not marked greeted, and the next focus retries

### Requirement: Audio plays for every audience
The system SHALL play the reply audio whenever the backend returns an audio
reference, for every user, and the backend SHALL synthesize a greeting and reply
for every user.

#### Scenario: Standard user
- **WHEN** a standard (non-accessible) user receives a greeting or reply with audio
- **THEN** the app plays it

### Requirement: A wedged turn cannot silence the assistant
The system SHALL watchdog the in-flight turn lock and release it after a bounded
time, and SHALL give visible feedback when a send or mic press is ignored because
a turn is already in flight.

#### Scenario: Lock is stuck
- **WHEN** the turn lock has been held past the watchdog window
- **THEN** it is released and the assistant accepts new turns

#### Scenario: Send while busy
- **WHEN** the user sends while a turn is in flight
- **THEN** a short "processing the previous reply" message is shown

### Requirement: Recording always ends and is not silently lost
The system SHALL always stop speech recognition when the user releases the
microphone, even while a background turn is in flight, and SHALL tell the user
when no speech was recognized or dictation is unavailable in the build.

#### Scenario: Empty transcript
- **WHEN** recognition ends with no text
- **THEN** the user is told "no te escuché" instead of nothing happening

#### Scenario: Unsupported build
- **WHEN** the native speech-recognition module is not present
- **THEN** the user is told dictation is unavailable
