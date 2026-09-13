## Purpose

The Soporte IA tab proactively greets the user when it is opened, speaking the greeting
for accessible users, without requiring a microphone-driven first turn.

## ADDED Requirements

### Requirement: The assistant greets when the tab is opened
The system SHALL, when the Soporte IA tab is focused with an active session, no explicit entry intent, and no conversation in progress, call the backend greeting endpoint and show the returned `assistant_text` — once per session.

#### Scenario: Open the tab for the first time
- **WHEN** the user opens the Soporte IA tab (from the bottom navigation or the Inicio banner) with an active session and no conversation
- **THEN** the system requests the greeting and shows the returned text without the user sending a message or using the microphone

#### Scenario: Explicit intent takes precedence
- **WHEN** the tab is opened with an explicit entry intent (for example a loan quick action)
- **THEN** no greeting request is made and the intent's own first turn proceeds

#### Scenario: No repeated greeting
- **WHEN** the user leaves the tab and returns after a conversation has started, or the tab regains focus
- **THEN** the greeting is not requested again for the same session

### Requirement: The greeting is spoken for accessible users
The system SHALL auto-play the greeting's `audio_ref` when the active catalog is `voz-color`, and SHALL not attempt playback for standard users (who receive text only).

#### Scenario: Accessible user hears the greeting
- **WHEN** an accessible user opens the Soporte IA tab and the greeting response includes `audio_ref`
- **THEN** the greeting audio plays without the user pressing the mic

#### Scenario: Standard user
- **WHEN** a standard user opens the tab
- **THEN** the greeting text is shown and no audio playback is attempted

### Requirement: The initial turn is not lost to session hydration
The system SHALL wait for the persisted session identifier before deciding whether to issue an initial turn, so a conversation that opens before the session has hydrated still starts its first turn exactly once.

#### Scenario: Session hydrates after mount
- **WHEN** the tab mounts before the persisted session is available and the session arrives shortly after
- **THEN** the initial turn (greeting or intent) is issued once, rather than being skipped

### Requirement: Greeting degrades gracefully when its endpoint is unavailable
The system SHALL treat a missing or unreachable dedicated greeting endpoint as a recoverable condition: it SHALL fall back to starting the conversation through the existing message endpoint rather than leaving the tab without a first turn.

#### Scenario: Dedicated greeting endpoint returns 404 or the backend is unreachable
- **WHEN** the greeting request fails with a not-found response or a network error
- **THEN** the system issues an initial message turn via the existing message endpoint (rendering its surface and playing its audio for accessible users), so the conversation still starts

#### Scenario: A transient greeting failure can retry
- **WHEN** the greeting fails for a reason other than a missing/unreachable endpoint
- **THEN** the tab is left able to retry the greeting on a later focus instead of being marked permanently greeted

