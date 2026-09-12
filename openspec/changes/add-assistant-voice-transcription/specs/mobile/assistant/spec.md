## Purpose

The Soporte IA tab's chat transcript and screen layout: what appears in the conversation thread, and which parts of the screen stay fixed versus scroll as that thread grows.

## ADDED Requirements

### Requirement: Transcribed voice input appears as a real chat message
The system SHALL render the user's recognized speech as the content of their chat bubble, not a placeholder label, once submitted.

#### Scenario: Voice turn shows the actual words spoken
- **WHEN** the user speaks into the mic and the recognized transcript is submitted
- **THEN** the resulting user chat bubble displays that transcript text, not a generic "voice message" label

### Requirement: The AI orb and greeting header never scroll off-screen
The system SHALL keep the animated orb, greeting text, mic button, and text-input pill fixed in place, and SHALL confine scrolling to the turn/message history area beneath them when that history overflows the available vertical space.

#### Scenario: Long conversation
- **WHEN** enough turns accumulate that the message history no longer fits in the space below the header
- **THEN** only the message history scrolls; the orb, greeting text, mic button, and text-input pill remain visible in place

#### Scenario: Short conversation
- **WHEN** the message history fits entirely within the available space
- **THEN** no scrolling occurs anywhere on the screen
